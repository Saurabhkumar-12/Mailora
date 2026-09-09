import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/email.js';
import slackRoutes from './routes/slack.js';
import { errorHandler } from './middleware/errorHandler.js';
import { bullBoardAuth } from './middleware/bullBoardAuth.js';
import { serverAdapter } from './config/bullBoard.js';

export const createApp = (): Application => {
  const app = express();

  // Security headers & CORS with credentials support
  app.use(helmet());
  app.use(
    cors({
      origin: [env.CLIENT_URL, env.FRONTEND_URL],
      credentials: true,
    })
  );

  // Cookie and Body parsing
  app.use(cookieParser(env.SESSION_SECRET));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/emails', emailRoutes);
  app.use('/api/slack', slackRoutes);

  // Bull Board Dashboard (Protected by HTTP Basic Auth with route-specific CSP adjustment for UI assets)
  app.use(
    '/admin/queues',
    (req, res, next) => {
      res.removeHeader('Content-Security-Policy');
      next();
    },
    bullBoardAuth,
    serverAdapter.getRouter()
  );

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
