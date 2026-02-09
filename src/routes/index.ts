import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import communityRoutes from './community.routes';
import eventRoutes from './event.routes';
import rsvpRoutes from './rsvp.routes';
import commentRoutes from './comment.routes';
import uploadRoutes from './upload.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/communities', communityRoutes);
router.use('/events', rsvpRoutes);
router.use('/events', commentRoutes);
router.use('/upload', uploadRoutes);
router.use('/events', eventRoutes);
router.use('/notifications', notificationRoutes);

export default router;
