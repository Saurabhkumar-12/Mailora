import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

/**
 * Zod Schema for validating Slack OAuth v2 Access Token response.
 */
const slackOAuthResponseSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  access_token: z.string().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  bot_user_id: z.string().optional(),
  app_id: z.string().optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  authed_user: z.object({
    id: z.string(),
  }).optional(),
  incoming_webhook: z.object({
    url: z.string(),
    channel: z.string().optional(),
    channel_id: z.string().optional(),
    configuration_url: z.string().optional(),
  }).optional(),
});

export class SlackService {
  /**
   * Builds the Slack OAuth v2 authorization URL with a secure random state.
   */
  static async buildAuthorizationUrl(userId: string): Promise<{ url: string; state: string }> {
    if (!env.SLACK_CLIENT_ID || env.SLACK_CLIENT_ID === 'placeholder_slack_client_id') {
      throw new Error('SLACK_CLIENT_ID is not configured in backend environment.');
    }

    const state = crypto.randomBytes(24).toString('hex');
    const stateKey = `slack:oauth:state:${state}`;

    // Store state with associated userId in Redis for 10 minutes (CSRF protection)
    await redisClient.set(stateKey, userId, 'EX', 600);

    const scopes = 'chat:write,incoming-webhook';
    const params = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      scope: scopes,
      redirect_uri: env.SLACK_REDIRECT_URI,
      state,
    });

    const url = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    return { url, state };
  }

  /**
   * Exchanges authorization code for an access token and persists the connection.
   */
  static async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<{ success: boolean; teamName?: string; userId: string }> {
    if (!state || !code) {
      throw new Error('Missing OAuth authorization code or state parameter.');
    }

    const stateKey = `slack:oauth:state:${state}`;
    const userId = await redisClient.get(stateKey);

    if (!userId) {
      throw new Error('Invalid or expired OAuth state parameter (CSRF protection check failed).');
    }

    // Immediately consume the state key to prevent replay attacks
    await redisClient.del(stateKey);

    if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
      throw new Error('Slack OAuth client credentials are missing in environment.');
    }

    const params = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: env.SLACK_REDIRECT_URI,
    });

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const json = await response.json();
    const parsed = slackOAuthResponseSchema.safeParse(json);

    if (!parsed.success || !parsed.data.ok || !parsed.data.access_token) {
      const errMsg = parsed.success ? parsed.data.error || 'OAuth token exchange failed' : 'Invalid Slack response schema';
      throw new Error(`Slack OAuth error: ${errMsg}`);
    }

    const data = parsed.data;
    const accessToken = data.access_token!;
    const teamId = data.team?.id || null;
    const teamName = data.team?.name || null;
    const slackUserId = data.authed_user?.id || null;
    const webhookUrl = data.incoming_webhook?.url || null;
    const channelId = data.incoming_webhook?.channel_id || null;
    const channelName = data.incoming_webhook?.channel || null;

    // Securely upsert the Slack connection in PostgreSQL
    await prisma.slackConnection.upsert({
      where: { userId },
      update: {
        accessToken,
        teamId,
        teamName,
        slackUserId,
        incomingWebhookUrl: webhookUrl,
        channelId,
        channelName,
        isConnected: true,
      },
      create: {
        userId,
        accessToken,
        teamId,
        teamName,
        slackUserId,
        incomingWebhookUrl: webhookUrl,
        channelId,
        channelName,
        isConnected: true,
      },
    });

    return {
      success: true,
      teamName: teamName || 'Slack Workspace',
      userId,
    };
  }

  /**
   * Returns sanitized connection status for the specified user.
   */
  static async getSlackStatus(userId: string) {
    const connection = await prisma.slackConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.isConnected) {
      return {
        connected: false,
      };
    }

    return {
      connected: true,
      teamName: connection.teamName || 'Slack Workspace',
      channelName: connection.channelName || null,
      connectedAt: connection.updatedAt.toISOString(),
    };
  }

  /**
   * Safely disconnects Slack integration for the specified user.
   */
  static async disconnectSlack(userId: string) {
    const connection = await prisma.slackConnection.findUnique({
      where: { userId },
    });

    if (connection && connection.isConnected) {
      await prisma.slackConnection.update({
        where: { userId },
        data: { isConnected: false },
      });
    }

    return {
      success: true,
      message: 'Slack disconnected successfully.',
    };
  }

  /**
   * Sends an automated hourly rate-limit alert to Slack if connected.
   * Uses Redis atomic SETNX for deduplication across distributed workers.
   */
  static async sendRateLimitNotification(
    userId: string,
    nextHour: Date,
    maxHourly: number
  ): Promise<boolean> {
    try {
      const connection = await prisma.slackConnection.findUnique({
        where: { userId },
      });

      if (!connection || !connection.isConnected || (!connection.accessToken && !connection.incomingWebhookUrl)) {
        return false;
      }

      // Calculate hour bucket (e.g. 492001) for atomic hourly deduplication
      const hourBucket = Math.floor(Date.now() / 3600000);
      const dedupKey = `slack:rate-limit-notified:${userId}:${hourBucket}`;

      // Atomic SETNX with 1-hour TTL (3600 seconds)
      const setnxResult = await redisClient.set(dedupKey, '1', 'EX', 3600, 'NX');
      if (setnxResult !== 'OK') {
        // Notification already sent for this rate-limit window
        return false;
      }

      const messageText = `⚠️ *Mailora Email Rate Limit Reached*\n` +
        `Your hourly email sending quota of *${maxHourly} emails/hr* has been reached.\n` +
        `Scheduled emails are being automatically delayed and queued for the next available window at *${nextHour.toUTCString()}*.`;

      if (connection.incomingWebhookUrl) {
        await fetch(connection.incomingWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: messageText }),
        });
      } else if (connection.accessToken) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${connection.accessToken}`,
          },
          body: JSON.stringify({
            channel: connection.channelId || '#general',
            text: messageText,
          }),
        });
      }

      console.log(`[Slack Notification] Successfully sent rate-limit alert for user ${userId}.`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Slack notification error';
      console.error(`[Slack Notification Error] Non-blocking alert failure for user ${userId}: ${message}`);
      return false;
    }
  }
}
