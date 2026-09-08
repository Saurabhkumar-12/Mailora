import { createApp } from './app.js';
import { env } from './config/env.js';
import { createEmailWorker } from './workers/emailWorker.js';

const app = createApp();

const emailWorker = createEmailWorker();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Mailora Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`📡 Health check available at http://localhost:${env.PORT}/api/health`);
  console.log(`⚡ BullMQ Email Worker active`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  await emailWorker.close();
  server.close(() => {
    console.log('HTTP server & worker closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
