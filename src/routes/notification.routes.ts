import { Router } from 'express';
import { notificationController } from '../modules/notification/in-app/notification.controller';
import { authenticate } from '../common/middlewares/auth.middleware';

const router = Router();

router.use(authenticate); // All routes require auth

router.get('/', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

export default router;
