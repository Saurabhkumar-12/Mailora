import { Worker, Job, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { getRedisConnectionOptions, getCleanRedisUrl } from '../config/redis.js';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../queues/emailQueue.js';
import { MailerService } from '../services/mailerService.js';
import { RateLimiterService } from '../services/rateLimiterService.js';
import { SearchService } from '../services/searchService.js';
import { SlackService } from '../services/slackService.js';
import { EmailStatus } from '@prisma/client';

export const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { emailId } = job.data;
  console.log(`[Worker] Processing email job ID: ${job.id} for Email record: ${emailId}`);

  // 1. Idempotency & Database state verification
  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) {
    console.warn(`[Worker] Email record ${emailId} not found in database. Aborting job.`);
    return;
  }

  // Prevent duplicate sending if already SENT
  if (email.status === EmailStatus.SENT || email.sentAt !== null) {
    console.log(`[Worker] Email ${emailId} is already SENT. Skipping to prevent duplicate send.`);
    return;
  }

  // Prevent sending if already FAILED / Cancelled by user
  if (email.status === EmailStatus.FAILED && email.errorMessage?.includes('Cancelled')) {
    console.log(`[Worker] Email ${emailId} was cancelled by user. Skipping execution.`);
    return;
  }

  // 2. Hourly Rate Limit Check & Rescheduling
  const quotaCheck = await RateLimiterService.acquireHourlyQuota(
    email.userId,
    email.senderId,
    {
      maxUserHourly: env.MAX_EMAILS_PER_HOUR,
      maxSenderHourly: env.MAX_EMAILS_PER_SENDER_PER_HOUR,
      maxGlobalHourly: env.MAX_GLOBAL_EMAILS_PER_HOUR,
    }
  );

  if (!quotaCheck.allowed && quotaCheck.delayToNextHourMs && quotaCheck.nextHour) {
    console.warn(
      `[Worker Rate Limit] ${quotaCheck.reason} Rescheduling email ${emailId} for next hour: ${quotaCheck.nextHour.toISOString()}`
    );

    // Update PostgreSQL scheduledAt to preserve source of truth & ordering
    await prisma.email.update({
      where: { id: emailId },
      data: {
        scheduledAt: quotaCheck.nextHour,
        status: EmailStatus.PENDING,
      },
    });

    // Attempt Slack notification asynchronously without blocking or failing the email job
    SlackService.sendRateLimitNotification(
      email.userId,
      quotaCheck.nextHour,
      env.MAX_EMAILS_PER_HOUR
    ).catch((err) => {
      console.error('[Slack Notification Error] Failed to send rate limit alert:', err?.message || err);
    });

    // Reschedule in BullMQ to delayed queue without dropping or failing job
    if (job.token) {
      await job.moveToDelayed(Date.now() + quotaCheck.delayToNextHourMs, job.token);
    }
    return;
  }

  // 3. Enforce global minimum send delay spacing across all workers
  await RateLimiterService.enforceMinSendDelay();

  // 4. Transition state to PROCESSING
  await prisma.email.update({
    where: { id: emailId },
    data: { status: EmailStatus.PROCESSING },
  });

  try {
    // 5. Send email via Nodemailer
    const result = await MailerService.sendMail({
      to: email.recipient,
      subject: email.subject,
      body: email.body,
    });

    // 6. Update state to SENT in PostgreSQL
    const updated = await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        errorMessage: null,
      },
    });

    // Idempotent Search Indexing (fails gracefully)
    SearchService.indexEmail(updated).catch(() => {});

    if (result.previewUrl) {
      console.log(`[Worker] Successfully sent email ${emailId}. Ethereal Preview URL: ${result.previewUrl}`);
    } else {
      console.log(`[Worker] Successfully sent email ${emailId} via SMTP. Message ID: ${result.messageId}`);
    }
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown mailer error';
    console.error(`[Worker Error] Failed to send email ${emailId}: ${errMessage}`);

    // Update state to FAILED in PostgreSQL
    const failedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.FAILED,
        failedAt: new Date(),
        errorMessage: errMessage,
      },
    });

    SearchService.indexEmail(failedEmail).catch(() => {});

    // Re-throw so BullMQ handles attempts and backoff
    throw error;
  }

};

export const createEmailWorker = (): Worker<EmailJobData> => {
  const workerOptions: WorkerOptions = {
    connection: new Redis(getCleanRedisUrl(), getRedisConnectionOptions()),
    concurrency: env.WORKER_CONCURRENCY,
    drainDelay: 500,
  };

  const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, workerOptions);

  worker.on('completed', (job) => {
    console.log(`[Worker Event] Job ${job.id} completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker Event] Job ${job?.id} failed with error: ${err.message}`);
  });

  return worker;
};
