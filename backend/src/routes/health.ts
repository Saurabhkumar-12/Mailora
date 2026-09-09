import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('[Health] Database ping failed:', error instanceof Error ? error.message : error);
    dbStatus = 'error';
  }

  try {
    const pong = await redisClient.ping();
    redisStatus = pong === 'PONG' ? 'connected' : 'degraded';
  } catch (error) {
    console.error('[Health] Redis ping failed:', error instanceof Error ? error.message : error);
    redisStatus = 'error';
  }

  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    service: 'mailora-backend',
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

router.get('/smtp/verify', async (_req: Request, res: Response) => {
  const { MailerService } = await import('../services/mailerService.js');
  const result = await MailerService.verifyConnection();
  res.status(result.ok ? 200 : 503).json(result);
});

export default router;
