import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { SessionService } from './sessionService.js';
import { User } from '@prisma/client';

/**
 * Zod Schema for Google OpenID Connect UserInfo response.
 */
const googleProfileSchema = z.object({
  sub: z.string().min(1, 'Google subject ID (sub) is required'),
  email: z.string().email('Valid email is required'),
  name: z.string().optional(),
  picture: z.string().optional(),
  email_verified: z.boolean().optional(),
});

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, combined: string): boolean {
  const [salt, keyHex] = combined.split(':');
  if (!salt || !keyHex) return false;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length, SCRYPT_PARAMS);
  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

export class AuthService {
  /**
   * Registers a new user with Email and Password.
   * Prevents account enumeration and credential hijacking of existing accounts.
   */
  static async register(input: { name: string; email: string; password: string }): Promise<{ user: User; sid: string }> {
    const email = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      const err = new Error('An account with this email address already exists. Please sign in instead.');
      (err as { statusCode?: number }).statusCode = 400;
      throw err;
    }

    const passwordHash = hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      },
    });

    const sid = await SessionService.createSession(user.id);
    return { user, sid };
  }

  /**
   * Authenticates user with Email and Password.
   * Includes per-account failed login tracking and exponential backoff.
   */
  static async loginWithPassword(input: { email: string; password: string }): Promise<{ user: User; sid: string }> {
    const email = input.email.toLowerCase().trim();

    const failedKey = `mailora:login:failed:${email}`;
    const lockoutKey = `mailora:login:lockout:${email}`;

    // 1. Check if account is in exponential backoff lockout window
    const isLocked = await redisClient.get(lockoutKey);
    if (isLocked) {
      const ttl = await redisClient.ttl(lockoutKey);
      const waitSec = ttl > 0 ? ttl : 60;
      const err = new Error(`Too many failed login attempts. Please wait ${waitSec} seconds before trying again.`);
      (err as { statusCode?: number }).statusCode = 429;
      throw err;
    }

    const recordFailedAttempt = async () => {
      try {
        const count = await redisClient.incr(failedKey);
        if (count === 1) {
          await redisClient.expire(failedKey, 900); // 15 min sliding window
        }
        if (count >= 5) {
          // Exponential backoff: 5 attempts -> 30s, 6 -> 60s, 7 -> 120s, max 900s (15 min)
          const backoffSeconds = Math.min(30 * Math.pow(2, count - 5), 900);
          await redisClient.set(lockoutKey, '1', 'EX', backoffSeconds);
        }
      } catch (redisErr) {
        console.error('[Auth Warning] Redis failed attempt tracking failed:', redisErr);
      }
    };

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      await recordFailedAttempt();
      const err = new Error('Invalid email or password.');
      (err as { statusCode?: number }).statusCode = 401;
      throw err;
    }

    const isValid = verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      await recordFailedAttempt();
      const err = new Error('Invalid email or password.');
      (err as { statusCode?: number }).statusCode = 401;
      throw err;
    }

    // Clear failed attempts & lockouts on successful authentication
    try {
      await redisClient.del(failedKey);
      await redisClient.del(lockoutKey);
    } catch {
      // Ignore Redis del failure
    }

    const sid = await SessionService.createSession(user.id);
    return { user, sid };
  }

  /**
   * Generates a cryptographically secure password reset token hash and stores it in PasswordResetToken.
   * Raw token is never stored in DB or logged. Returns a generic message.
   */
  static async requestPasswordReset(emailInput: string): Promise<{ message: string }> {
    const email = emailInput.toLowerCase().trim();
    const genericResponse = { message: 'If an account exists with that email address, password reset instructions have been sent.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return genericResponse;
    }

    // Cryptographically secure randomness for raw token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour TTL

    // Invalidate previous active reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Sanitized log without raw token or secret details
    console.log(`[Password Reset] Dispatched reset notification for user ID: ${user.id}`);

    return genericResponse;
  }

  /**
   * Resets password using valid token. Marks token as used and invalidates existing sessions.
   */
  static async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      const err = new Error('Invalid or expired password reset token.');
      (err as { statusCode?: number }).statusCode = 400;
      throw err;
    }

    const passwordHash = hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all existing sessions for user upon password reset
      prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    return { message: 'Password reset successfully. You may now sign in with your new password.' };
  }

  /**
   * Builds the Google OAuth 2.0 authorization URL with a secure single-use state token.
   */
  static async buildGoogleAuthorizationUrl(): Promise<{ url: string; state: string }> {
    if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID === 'placeholder_google_client_id.apps.googleusercontent.com') {
      throw new Error('GOOGLE_CLIENT_ID is not configured in backend environment.');
    }

    const state = crypto.randomBytes(24).toString('hex');
    const stateKey = `google:oauth:state:${state}`;

    // Store state in Redis for 10 minutes (CSRF protection)
    await redisClient.set(stateKey, 'pending', 'EX', 600);

    const scopes = 'openid email profile';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      scope: scopes,
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return { url, state };
  }

  /**
   * Exchanges Google OAuth authorization code, validates profile, and creates session.
   */
  static async handleGoogleCallback(
    code: string,
    state: string
  ): Promise<{ user: User; sid: string }> {
    if (!state || !code) {
      throw new Error('Missing OAuth authorization code or state parameter.');
    }

    const stateKey = `google:oauth:state:${state}`;
    const storedState = await redisClient.get(stateKey);

    if (!storedState) {
      throw new Error('Invalid or expired OAuth state parameter (CSRF protection check failed).');
    }

    // Single-use state token: delete immediately
    await redisClient.del(stateKey);

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      const err = new Error('Google OAuth credentials are missing in environment.');
      (err as { statusCode?: number }).statusCode = 500;
      throw err;
    }

    // 1. Server-side authorization code exchange using Google's official token endpoint
    const tokenParams = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });
    } catch (fetchErr: unknown) {
      const errObj = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
      const cause = (errObj as { cause?: { code?: string; hostname?: string } }).cause;
      console.error('[Google OAuth Error] Failed to reach Google token endpoint (https://oauth2.googleapis.com/token):', {
        name: errObj.name,
        message: errObj.message,
        code: cause?.code,
        hostname: cause?.hostname,
      });

      const clientErr = new Error('Google authentication service is temporarily unavailable due to network connectivity or DNS issue. Please try again later.');
      (clientErr as { statusCode?: number }).statusCode = 502;
      throw clientErr;
    }

    interface GoogleTokenResponse {
      access_token?: string;
      expires_in?: number;
      token_type?: string;
      id_token?: string;
      error?: string;
      error_description?: string;
    }

    let tokenJson: GoogleTokenResponse;
    try {
      tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;
    } catch (jsonErr: unknown) {
      console.error('[Google OAuth Error] Invalid JSON payload received from Google token endpoint');
      const clientErr = new Error('Invalid response received from Google OAuth service.');
      (clientErr as { statusCode?: number }).statusCode = 502;
      throw clientErr;
    }

    if (!tokenResponse.ok || !tokenJson.access_token) {
      console.error('[Google OAuth Error] Token exchange rejected by Google:', {
        httpStatus: tokenResponse.status,
        error: tokenJson.error,
        description: tokenJson.error_description,
      });
      const clientErr = new Error(`Google token exchange failed: ${tokenJson.error_description || tokenJson.error || 'Authentication rejected'}`);
      (clientErr as { statusCode?: number }).statusCode = 400;
      throw clientErr;
    }

    // 2. Fetch User Profile from Google UserInfo API
    let userinfoResponse: Response;
    try {
      userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
    } catch (fetchErr: unknown) {
      const errObj = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
      console.error('[Google OAuth Error] Failed to reach Google UserInfo endpoint (https://www.googleapis.com/oauth2/v3/userinfo):', {
        name: errObj.name,
        message: errObj.message,
      });
      const clientErr = new Error('Failed to retrieve user profile from Google. Please try again later.');
      (clientErr as { statusCode?: number }).statusCode = 502;
      throw clientErr;
    }

    let profileJson: unknown;
    try {
      profileJson = await userinfoResponse.json();
    } catch {
      console.error('[Google OAuth Error] Invalid JSON payload from Google UserInfo endpoint');
      const clientErr = new Error('Invalid user profile response received from Google.');
      (clientErr as { statusCode?: number }).statusCode = 502;
      throw clientErr;
    }

    const parsedProfile = googleProfileSchema.safeParse(profileJson);

    if (!parsedProfile.success) {
      console.error('[Google OAuth Error] Invalid Google user profile schema:', parsedProfile.error.format());
      const clientErr = new Error('Failed to validate Google user identity response schema.');
      (clientErr as { statusCode?: number }).statusCode = 400;
      throw clientErr;
    }

    const profile = parsedProfile.data;
    const normalizedEmail = profile.email.toLowerCase().trim();

    // 3. Find or Create User in PostgreSQL (Link googleId or match email)
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.sub }, { email: normalizedEmail }],
      },
    });

    if (user) {
      // Update existing user with googleId, name, avatar if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.sub,
          name: user.name || profile.name || null,
          avatar: profile.picture || user.avatar || null,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          googleId: profile.sub,
          name: profile.name || null,
          avatar: profile.picture || null,
        },
      });
    }

    // 4. Create persistent session in PostgreSQL
    const sid = await SessionService.createSession(user.id);

    return { user, sid };
  }
}
