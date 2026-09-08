import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Something went wrong';

  console.error(`[Error] ${req.method} ${req.path} -> ${statusCode}: ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
