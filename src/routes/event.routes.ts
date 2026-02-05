import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent, checkInUser, uploadEventPhoto, scanTicket } from '../modules/event/event.controller';
import { createEventValidation, getEventsValidation } from '../modules/event/event.validation';
import { optionalAuthenticate, authenticate, authorize } from '../common/middlewares/auth.middleware';
import { UserRole } from '../modules/user/user.types';

const router = Router();

router.post('/', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), createEventValidation, createEvent);
router.get('/', optionalAuthenticate, getEventsValidation, getEvents);
router.get('/:id', optionalAuthenticate, getEventById);
router.patch('/:id', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), updateEvent);
router.delete('/:id', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), deleteEvent);
router.post('/:id/checkin/:userId', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), checkInUser);
router.post('/:id/scan', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), scanTicket);
router.post('/:id/photos', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), uploadEventPhoto);

export default router;
