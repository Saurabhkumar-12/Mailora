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

export class AuthService {
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
