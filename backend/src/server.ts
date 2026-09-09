import { createApp } from './app.js';
import { env } from './config/env.js';
import { createEmailWorker } from './workers/emailWorker.js';

import { EmailService } from './services/emailService.js';
import { prisma } from './config/db.js';
import { redisClient } from './config/redis.js';

const app = createApp();

const emailWorker = createEmailWorker();

let reconciliationPromise: Promise<{ checked: number; recovered: number; success: boolean }> | null = null;

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 Mailora Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`📡 Health check available at http://0.0.0.0:${env.PORT}/api/health`);
  console.log(`⚡ BullMQ Email Worker active`);

  // Run startup reconciliation asynchronously in background without blocking API availability
  reconciliationPromise = EmailService.reconcilePendingEmails().catch((err: unknown) => {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Startup Error] Unexpected reconciliation failure: ${errMessage}`);
    return { checked: 0, recovered: 0, success: false };
  });
});


// Graceful shutdown handling
let isShuttingDown = false;

const handleShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  // 1. Stop accepting new HTTP requests
  server.close(() => {
    console.log('HTTP server stopped accepting new connections.');
  });

  // 2. Await background reconciliation task with a timeout if still in progress
  if (reconciliationPromise) {
    console.log('⏳ Awaiting background email queue reconciliation task completion...');
    const SHUTDOWN_RECONCILIATION_TIMEOUT_MS = 8000;

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn(
          `⚠️ Reconciliation wait timed out after ${SHUTDOWN_RECONCILIATION_TIMEOUT_MS}ms. Proceeding with shutdown.`
        );
        resolve();
      }, SHUTDOWN_RECONCILIATION_TIMEOUT_MS);
    });

    await Promise.race([reconciliationPromise.then(() => {}), timeoutPromise]);
  }

  // 3. Gracefully close BullMQ worker
  try {
    await emailWorker.close();
    console.log('BullMQ Email Worker closed.');
  } catch (workerErr: unknown) {
    const errMessage = workerErr instanceof Error ? workerErr.message : String(workerErr);
    console.error(`[Shutdown Warning] Error closing email worker: ${errMessage}`);
  }

  // 4. Disconnect Prisma & Redis
  try {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  } catch {
    // Ignore errors during exit
  }

  try {
    redisClient.disconnect();
    console.log('Redis client disconnected.');
  } catch {
    // Ignore errors during exit
  }

  console.log('Shutdown sequence complete. Exiting.');
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

