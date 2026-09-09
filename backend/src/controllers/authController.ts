import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { SessionService } from '../services/sessionService.js';
import { env } from '../config/env.js';

export class AuthController {
  /**
   * GET /api/auth/google
   * Redirects user to Google's OAuth 2.0 authorization server.
   */
  static async startGoogleOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = await AuthService.buildGoogleAuthorizationUrl();

      if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
        res.status(200).json({
          success: true,
          url,
        });
        return;
      }

      res.redirect(url);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/google/callback
   * Handles Google OAuth redirect callback, exchanges code, creates signed HttpOnly session cookie.
   */
  static async handleGoogleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(String(oauthError))}`);
        return;
      }

      if (typeof code !== 'string' || typeof state !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid OAuth callback parameters. "code" and "state" are required.',
        });
        return;
      }

      const result = await AuthService.handleGoogleCallback(code, state);

      // Set signed HttpOnly session cookie
      res.cookie('mailora_sid', result.sid, {
        httpOnly: true,
        signed: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      if (req.headers.accept?.includes('application/json')) {
        res.status(200).json({
          success: true,
          message: 'Authenticated successfully',
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              avatar: result.user.avatar,
            },
          },
        });
        return;
      }

      res.redirect(env.FRONTEND_URL);
    } catch (error) {
      if (req.headers.accept?.includes('application/json')) {
        next(error);
        return;
      }
      const errMessage = error instanceof Error ? error.message : 'Google authentication failed';
      res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(errMessage)}`);
    }
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user profile.
   */
  static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Unauthenticated',
        });
        return;
      }

      res.status(200).json({
        success: true,
        authenticated: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.avatar,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Destroys current session and clears signed session cookie.
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sid = req.signedCookies?.mailora_sid;

      if (sid) {
        await SessionService.destroySession(sid);
      }

      res.clearCookie('mailora_sid', { path: '/' });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
