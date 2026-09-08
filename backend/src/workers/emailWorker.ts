import { Worker, Job, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '../config/db.js';
import { getRedisConnectionOptions, getCleanRedisUrl } from '../config/redis.js';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../queues/emailQueue.js';
import { MailerService } from '../services/mailerService.js';
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
  if (email.status === EmailStatus.SENT) {
    console.log(`[Worker] Email ${emailId} is already SENT. Skipping to prevent duplicate send.`);
    return;
  }

  // Prevent sending if already FAILED / Cancelled by user
  if (email.status === EmailStatus.FAILED && email.errorMessage?.includes('Cancelled')) {
    console.log(`[Worker] Email ${emailId} was cancelled by user. Skipping execution.`);
    return;
  }

  // 2. Transition state to PROCESSING
  await prisma.email.update({
    where: { id: emailId },
    data: { status: EmailStatus.PROCESSING },
  });

  try {
    // 3. Send email via Nodemailer + Ethereal SMTP
    const result = await MailerService.sendMail({
      to: email.recipient,
      subject: email.subject,
      body: email.body,
    });

    // 4. Update state to SENT in PostgreSQL
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(`[Worker] Successfully sent email ${emailId}. Preview URL: ${result.previewUrl || 'N/A'}`);
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown mailer error';
    console.error(`[Worker Error] Failed to send email ${emailId}: ${errMessage}`);

    // 5. Update state to FAILED in PostgreSQL
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.FAILED,
        failedAt: new Date(),
        errorMessage: errMessage,
      },
    });

    // Re-throw so BullMQ handles attempts and backoff
    throw error;
  }
};

export const createEmailWorker = (): Worker<EmailJobData> => {
  const workerOptions: WorkerOptions = {
    connection: new Redis(getCleanRedisUrl(), getRedisConnectionOptions()),
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
