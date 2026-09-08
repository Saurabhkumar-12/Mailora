import { Queue, QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { getRedisConnectionOptions, getCleanRedisUrl } from '../config/redis.js';

export const EMAIL_QUEUE_NAME = 'mailora-email-queue';

export interface EmailJobData {
  emailId: string;
  userId: string;
}

const queueOptions: QueueOptions = {
  connection: new Redis(getCleanRedisUrl(), getRedisConnectionOptions()),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // keep completed jobs for 24 hours
      count: 5000,
    },
    removeOnFail: {
      age: 604800, // keep failed jobs for 7 days
    },
  },
};

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, queueOptions);
