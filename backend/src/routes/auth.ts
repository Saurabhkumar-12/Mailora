import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  authStartLimiter,
  authCallbackLimiter,
  authMeLimiter,
  authLogoutLimiter,
} from '../middleware/authRateLimiter.js';

const router = Router();

// Password Authentication Flow
router.post('/register', authStartLimiter, AuthController.register);
router.post('/login', authStartLimiter, AuthController.login);
router.post('/forgot-password', authStartLimiter, AuthController.forgotPassword);
router.post('/reset-password', authStartLimiter, AuthController.resetPassword);

// Google OAuth Flow
router.get('/google', authStartLimiter, AuthController.startGoogleOAuth);
router.get('/google/callback', authCallbackLimiter, AuthController.handleGoogleCallback);

// Session Management
router.get('/me', authMeLimiter, authenticate, AuthController.getCurrentUser);
router.post('/logout', authLogoutLimiter, AuthController.logout);

export default router;
