import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';

const router = Router();

router.post('/schedule', EmailController.schedule);
router.post('/schedule-batch', EmailController.scheduleBatch);
router.get('/scheduled', EmailController.getScheduled);
router.get('/sent', EmailController.getSent);
router.get('/search', EmailController.search);
router.get('/:id', EmailController.getById);
router.delete('/:id', EmailController.cancel);


export default router;
