import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all email scheduling and retrieval routes with session authentication
router.use(authenticate);

router.post('/schedule', EmailController.schedule);
router.post('/schedule-batch', EmailController.scheduleBatch);
router.get('/scheduled', EmailController.getScheduled);
router.get('/sent', EmailController.getSent);
router.get('/search', EmailController.search);
router.get('/:id', EmailController.getById);
router.delete('/:id', EmailController.cancel);
router.post('/:id/cancel', EmailController.cancel);

export default router;
