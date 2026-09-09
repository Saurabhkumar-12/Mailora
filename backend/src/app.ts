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

  // Trust proxy for secure cookies and accurate client IP behind Render/reverse proxy
  app.set('trust proxy', 1);

  // Normalize allowed CORS origins
  const allowedOrigins = [
    env.CLIENT_URL.replace(/\/$/, ''),
    env.FRONTEND_URL.replace(/\/$/, ''),
    'https://mailora-mail.vercel.app',
    'http://localhost:5173',
  ];

  // Security headers & CORS with credentials support
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile apps, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'Accept'],
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
