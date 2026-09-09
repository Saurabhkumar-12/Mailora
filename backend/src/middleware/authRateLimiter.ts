import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';

/**
 * Creates a lightweight Redis fixed-window rate limiter middleware.
 */
export const createRateLimiter = (
  prefix: string,
  maxRequests: number,
  windowSeconds: number
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const currentWindow = Math.floor(Date.now() / (windowSeconds * 1000));
      const key = `mailora:ratelimit:${prefix}:${ip}:${currentWindow}`;

      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      if (count > maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
        });
        return;
      }

      next();
    } catch {
      // Fail open: if Redis is temporarily unreachable, do not block legitimate authentication
      next();
    }
  };
};

export const authStartLimiter = createRateLimiter('auth:start', 15, 60);
export const authCallbackLimiter = createRateLimiter('auth:callback', 15, 60);
export const authMeLimiter = createRateLimiter('auth:me', 120, 60);
export const authLogoutLimiter = createRateLimiter('auth:logout', 30, 60);
