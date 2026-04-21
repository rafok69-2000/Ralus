import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  sseHandler,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '../controllers/notification.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/stream', sseHandler);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/clear', clearNotifications);

export default router;
