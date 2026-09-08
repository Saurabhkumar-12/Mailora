import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('[Health] Database ping failed:', error instanceof Error ? error.message : error);
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    service: 'mailora-backend',
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
