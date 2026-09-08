import { prisma } from '../config/db.js';
import { emailQueue } from '../queues/emailQueue.js';
import { ScheduleEmailInput, ScheduleBatchEmailInput } from '../schemas/emailSchema.js';
import { EmailStatus } from '@prisma/client';
import { SearchService } from './searchService.js';


export class EmailService {
  /**
   * Helper to ensure a development/test user exists in PostgreSQL.
   */
  static async getOrCreateDefaultUser(): Promise<string> {
    const defaultEmail = 'demo@mailora.local';
    const user = await prisma.user.upsert({
      where: { email: defaultEmail },
      update: {},
      create: {
        email: defaultEmail,
        name: 'Mailora Demo User',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=mailora',
      },
    });
    return user.id;
  }

  /**
   * Schedules a single email with a delayed BullMQ job.
   */
  static async scheduleEmail(input: ScheduleEmailInput, authUserId?: string) {
    const userId = authUserId || input.userId || (await this.getOrCreateDefaultUser());

    const scheduledDate = new Date(input.scheduledAt);
    const now = Date.now();
    const delayMs = Math.max(0, scheduledDate.getTime() - now);

    // 1. Persist in PostgreSQL as source of truth
    const email = await prisma.email.create({
      data: {
        recipient: input.recipient.toLowerCase().trim(),
        subject: input.subject.trim(),
        body: input.body,
        status: EmailStatus.PENDING,
        scheduledAt: scheduledDate,
        userId,
        senderId: input.senderId || null,
      },
    });

    // 2. Queue delayed job with deterministic jobId = email.id for idempotency
    try {
      await emailQueue.add(
        'send-email',
        {
          emailId: email.id,
          userId,
        },
        {
          jobId: email.id,
          delay: delayMs,
        }
      );

      // 3. Link jobId in DB
      const updated = await prisma.email.update({
        where: { id: email.id },
        data: { jobId: email.id },
      });

      // 4. Asynchronously index in Elasticsearch (idempotent; fails gracefully)
      SearchService.indexEmail(updated).catch(() => {});

      return {
        email: updated,
        queue: {
          jobId: email.id,
          delayMs,
          scheduledFor: scheduledDate.toISOString(),
        },
      };

    } catch (queueError) {
      console.error('[Queue Error] Failed to enqueue email job:', queueError);
      // Mark as failed in DB if queue rejects it
      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: 'Failed to enqueue job in BullMQ',
          failedAt: new Date(),
        },
      });
      throw queueError;
    }
  }

  /**
   * Schedules a batch of emails with optional staggered delays.
   */
  static async scheduleBatch(input: ScheduleBatchEmailInput, authUserId?: string) {
    const userId = authUserId || input.userId || (await this.getOrCreateDefaultUser());

    // Deduplicate recipient emails (case-insensitive)
    const uniqueRecipients = Array.from(
      new Set(input.recipients.map((r) => r.toLowerCase().trim()))
    );

    const baseTime = input.startTime ? new Date(input.startTime).getTime() : Date.now();
    const delayStep = input.delayBetweenEmailsMs || 0;

    const results = [];

    for (let i = 0; i < uniqueRecipients.length; i++) {
      const recipient = uniqueRecipients[i];
      const scheduledTime = new Date(baseTime + i * delayStep);

      const scheduled = await this.scheduleEmail(
        {
          recipient,
          subject: input.subject,
          body: input.body,
          scheduledAt: scheduledTime.toISOString(),
          senderId: input.senderId,
          userId,
        },
        userId
      );

      results.push(scheduled);
    }

    return {
      totalRequested: input.recipients.length,
      totalQueued: results.length,
      emails: results,
    };
  }

  /**
   * Fetch scheduled/pending emails.
   */
  static async getScheduledEmails(userId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const whereClause = {
      status: { in: [EmailStatus.PENDING, EmailStatus.PROCESSING] },
      ...(userId ? { userId } : {}),
    };

    const [total, emails] = await Promise.all([
      prisma.email.count({ where: whereClause }),
      prisma.email.findMany({
        where: whereClause,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);

    return {
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Fetch sent emails.
   */
  static async getSentEmails(userId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const whereClause = {
      status: EmailStatus.SENT,
      ...(userId ? { userId } : {}),
    };

    const [total, emails] = await Promise.all([
      prisma.email.count({ where: whereClause }),
      prisma.email.findMany({
        where: whereClause,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);

    return {
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single email by ID.
   */
  static async getEmailById(id: string) {
    return prisma.email.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, email: true, name: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  /**
   * Cancels a pending scheduled email from both BullMQ and database.
   */
  static async cancelEmail(id: string, userId?: string) {
    const email = await prisma.email.findUnique({ where: { id } });

    if (!email) {
      return { found: false, error: 'Email not found' };
    }

    if (userId && email.userId !== userId) {
      return { found: false, error: 'Unauthorized to cancel this email' };
    }

    if (email.status === EmailStatus.SENT) {
      return { found: true, canCancel: false, error: 'Cannot cancel an email that has already been sent' };
    }

    // Remove job from BullMQ queue if present
    if (email.jobId) {
      try {
        const job = await emailQueue.getJob(email.jobId);
        if (job) {
          await job.remove();
        }
      } catch (err) {
        console.warn(`[Queue Warning] Could not remove job ${email.jobId} from queue:`, err);
      }
    }

    // Update status in DB
    const updated = await prisma.email.update({
      where: { id },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: 'Cancelled by user before delivery',
        failedAt: new Date(),
      },
    });

    SearchService.indexEmail(updated).catch(() => {});

    return { found: true, canCancel: true, email: updated };
  }

  /**
   * Startup Recovery & Reconciliation Service:
   * Scans PostgreSQL (source of truth) for PENDING or PROCESSING emails.
   * Restores missing BullMQ jobs with exact remaining delay.
   */
  static async reconcilePendingEmails(): Promise<{ checked: number; recovered: number }> {
    console.log('🔄 Running email queue reconciliation scan...');
    await SearchService.ensureIndexExists();


    const pendingOrProcessing = await prisma.email.findMany({
      where: {
        status: { in: [EmailStatus.PENDING, EmailStatus.PROCESSING] },
      },
    });

    let recoveredCount = 0;

    for (const email of pendingOrProcessing) {
      try {
        const existingJob = await emailQueue.getJob(email.id);

        if (existingJob) {
          const state = await existingJob.getState();
          if (state === 'completed' && email.status !== EmailStatus.SENT) {
            await prisma.email.update({
              where: { id: email.id },
              data: { status: EmailStatus.SENT, sentAt: new Date() },
            });
            console.log(`[Reconciliation] Synced email ${email.id} to SENT state.`);
            recoveredCount++;
            continue;
          }
          if (['active', 'delayed', 'waiting'].includes(state)) {
            continue;
          }
        }

        // Job missing from queue or was stuck in PROCESSING due to worker crash
        if (email.status === EmailStatus.PROCESSING) {
          await prisma.email.update({
            where: { id: email.id },
            data: { status: EmailStatus.PENDING },
          });
        }

        const now = Date.now();
        const delayMs = Math.max(0, new Date(email.scheduledAt).getTime() - now);

        await emailQueue.add(
          'send-email',
          { emailId: email.id, userId: email.userId },
          {
            jobId: email.id,
            delay: delayMs,
          }
        );

        await prisma.email.update({
          where: { id: email.id },
          data: { jobId: email.id },
        });

        console.log(
          `[Recovery] Restored missing BullMQ job for email ${email.id} (Scheduled: ${email.scheduledAt.toISOString()}, delay: ${delayMs}ms)`
        );
        recoveredCount++;
      } catch (err) {
        console.error(`[Recovery Error] Failed to reconcile email ${email.id}:`, err);
      }
    }

    console.log(`✅ Reconciliation complete. Checked: ${pendingOrProcessing.length}, Recovered: ${recoveredCount}`);
    return { checked: pendingOrProcessing.length, recovered: recoveredCount };
  }
}

