import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slackService.js';

export class SlackController {
  /**
   * GET /api/slack/oauth/start
   * Initiates Slack OAuth flow by redirecting to Slack's authorization URL.
   */
  static async startOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

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
   * Returns current authenticated user's Slack connection status.
   */
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

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
   * Safely disconnects Slack integration for the authenticated user.
   */
  static async disconnect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

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
