import { Router } from 'express';
import { SlackController } from '../controllers/slackController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Slack OAuth Flow Endpoints
router.get('/oauth/start', authenticate, SlackController.startOAuth);
router.get('/oauth/callback', SlackController.handleCallback);

// Slack Status & Management Endpoints (Protected by session authentication)
router.get('/status', authenticate, SlackController.getStatus);
router.post('/disconnect', authenticate, SlackController.disconnect);

export default router;
