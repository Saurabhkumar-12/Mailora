import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slackService.js';
import { EmailService } from '../services/emailService.js';
import { prisma } from '../config/db.js';

/**
 * Helper to identify the current user ID for the request.
 * Uses query/header parameter if provided, otherwise defaults to the demo user.
 */
const getUserIdFromReq = async (req: Request): Promise<string> => {
  const customUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || (req.body?.userId as string);
  if (customUserId) {
    const existing = await prisma.user.findUnique({ where: { id: customUserId } });
    if (existing) return existing.id;
  }
  return EmailService.getOrCreateDefaultUser();
};

export class SlackController {
  /**
   * GET /api/slack/oauth/start
   * Initiates Slack OAuth flow by redirecting to Slack's authorization URL.
   */
  static async startOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = await getUserIdFromReq(req);
      const { url } = await SlackService.buildAuthorizationUrl(userId);

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
   * GET /api/slack/oauth/callback
   * Handles OAuth authorization code exchange from Slack.
   */
  static async handleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Slack Authorization Denied - Mailora</title></head>
            <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
              <h2 style="color: #ef4444;">Slack Connection Denied</h2>
              <p>Authorization was cancelled or denied: <code>${oauthError}</code></p>
            </body>
          </html>
        `);
        return;
      }

      if (typeof code !== 'string' || typeof state !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid OAuth callback parameters. "code" and "state" are required strings.',
        });
        return;
      }

      const result = await SlackService.handleOAuthCallback(code, state);

      if (req.headers.accept?.includes('application/json')) {
        res.status(200).json({
          success: true,
          message: `Slack successfully connected to ${result.teamName}`,
          data: result,
        });
        return;
      }

      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Slack Connected - Mailora</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
            <h2 style="color: #22c55e;">⚡ Slack Connected Successfully!</h2>
            <p>Mailora has been successfully connected to <strong>${result.teamName}</strong>.</p>
            <p>You can close this window now.</p>
          </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/slack/status
   * Returns current Slack connection status without exposing sensitive tokens.
   */
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = await getUserIdFromReq(req);
      const status = await SlackService.getSlackStatus(userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/slack/disconnect
   * Safely disconnects Slack integration.
   */
  static async disconnect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = await getUserIdFromReq(req);
      const result = await SlackService.disconnectSlack(userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
