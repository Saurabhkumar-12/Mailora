import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Perform a timing-safe string comparison to prevent timing attacks.
 */
const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Run constant-time comparison on dummy buffer of equal length to avoid length timing leak
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Middleware for HTTP Basic Authentication protecting the Bull Board dashboard.
 */
export const bullBoardAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Dashboard"');
    res.status(401).send('Authentication required');
    return;
  }

  const credentialsBase64 = authHeader.split(' ')[1];
  if (!credentialsBase64) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Dashboard"');
    res.status(401).send('Authentication required');
    return;
  }

  try {
    const decoded = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Dashboard"');
      res.status(401).send('Authentication required');
      return;
    }

    const username = decoded.substring(0, separatorIndex);
    const password = decoded.substring(separatorIndex + 1);

    const userValid = safeCompare(username, env.BULL_BOARD_USER);
    const passValid = safeCompare(password, env.BULL_BOARD_PASS);

    if (userValid && passValid) {
      return next();
    }
  } catch {
    // Ignore decoding errors safely
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Dashboard"');
  res.status(401).send('Invalid credentials');
};
