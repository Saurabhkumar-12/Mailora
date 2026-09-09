import { Router } from 'express';
import { SlackController } from '../controllers/slackController.js';

const router = Router();

// Slack OAuth Flow Endpoints
router.get('/oauth/start', SlackController.startOAuth);
router.get('/oauth/callback', SlackController.handleCallback);

// Slack Status & Management Endpoints
router.get('/status', SlackController.getStatus);
router.post('/disconnect', SlackController.disconnect);

export default router;
