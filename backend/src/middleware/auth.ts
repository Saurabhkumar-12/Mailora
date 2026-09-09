import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import { SessionService } from '../services/sessionService.js';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Extracts session ID from signed HttpOnly cookie, Authorization Bearer header, or x-session-id.
 */
const getSessionId = (req: Request): string | null => {
  if (req.signedCookies && typeof req.signedCookies.mailora_sid === 'string') {
    return req.signedCookies.mailora_sid;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (typeof req.headers['x-session-id'] === 'string') {
    return req.headers['x-session-id'].trim();
  }
  return null;
};

/**
 * Middleware that strictly enforces authenticated session.
 * Rejects unauthenticated requests with HTTP 401.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sid = getSessionId(req);
    if (!sid) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in with Google.',
      });
      return;
    }

    const user = await SessionService.getSessionUser(sid);
    if (!user) {
      const isProduction = env.NODE_ENV === 'production';
      res.clearCookie('mailora_sid', {
        path: '/',
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please sign in again.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware that optionally attaches the authenticated user if session exists.
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const sid = getSessionId(req);
    if (sid) {
      const user = await SessionService.getSessionUser(sid);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};
