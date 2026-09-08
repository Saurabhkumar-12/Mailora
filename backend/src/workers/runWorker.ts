import { createEmailWorker } from './emailWorker.js';
import { EmailService } from '../services/emailService.js';

async function bootstrap() {
  console.log('⚡ Starting Mailora Email Worker...');

  // Reconcile pending/missing jobs on startup
  await EmailService.reconcilePendingEmails();

  const worker = createEmailWorker();
  console.log('✅ Email Worker active and waiting for BullMQ jobs.');

  const handleShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Closing worker...`);
    await worker.close();
    console.log('Worker closed cleanly.');
    process.exit(0);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal worker startup error:', err);
  process.exit(1);
});
