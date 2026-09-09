import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { SessionService } from '../services/sessionService.js';
import { env } from '../config/env.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/authSchema.js';

const isProduction = env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  partitioned: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const getEffectiveFrontendUrl = (): string => {
  const url = env.FRONTEND_URL?.trim();
  if (url && url !== 'http://localhost:5173') {
    return url.replace(/\/$/, '');
  }
  if (env.NODE_ENV === 'production') {
    return 'https://mailora-mail.vercel.app';
  }
  return (url || 'http://localhost:5173').replace(/\/$/, '');
};

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers new user with Email/Password and sets signed HttpOnly session cookie.
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);
      const result = await AuthService.register(input);

      res.cookie('mailora_sid', result.sid, COOKIE_OPTIONS);
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          sessionToken: result.sid,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            avatar: result.user.avatar,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user with Email/Password and sets signed HttpOnly session cookie.
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const result = await AuthService.loginWithPassword(input);

      res.cookie('mailora_sid', result.sid, COOKIE_OPTIONS);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          sessionToken: result.sid,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            avatar: result.user.avatar,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Dispatches password reset token notification.
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Resets user password using reset token.
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

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
        res.redirect(`${getEffectiveFrontendUrl()}/login?error=${encodeURIComponent(String(oauthError))}`);
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
      res.cookie('mailora_sid', result.sid, COOKIE_OPTIONS);

      if (req.headers.accept?.includes('application/json')) {
        res.status(200).json({
          success: true,
          message: 'Authenticated successfully',
          data: {
            sessionToken: result.sid,
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

      res.redirect(`${getEffectiveFrontendUrl()}/?session_token=${encodeURIComponent(result.sid)}`);
    } catch (error) {
      if (req.headers.accept?.includes('application/json')) {
        next(error);
        return;
      }
      const errMessage = error instanceof Error ? error.message : 'Google authentication failed';
      res.redirect(`${getEffectiveFrontendUrl()}/login?error=${encodeURIComponent(errMessage)}`);
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
      const sid =
        req.signedCookies?.mailora_sid ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.substring(7).trim()
          : null) ||
        (typeof req.headers['x-session-id'] === 'string' ? req.headers['x-session-id'].trim() : null);

      if (sid) {
        await SessionService.destroySession(sid);
      }

      res.clearCookie('mailora_sid', {
        path: '/',
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
