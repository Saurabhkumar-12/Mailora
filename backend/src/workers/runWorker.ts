import { createEmailWorker } from './emailWorker.js';

console.log('⚡ Starting Mailora Email Worker...');
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
