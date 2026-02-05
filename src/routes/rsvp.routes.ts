import { Router } from 'express';
import { rsvpEvent, getAttendees, checkInUser, getUserRsvps } from '../modules/rsvp/rsvp.controller';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { body } from 'express-validator';
import { RsvpStatus } from '../modules/rsvp/rsvp.types';
import { UserRole } from '../modules/user/user.types';

const router = Router();

// Routes relative to /api/events implied by mounting strategy or must be explicit?
// Strategy: Mount this router at /api/events in index.ts
// So paths here are /:id/rsvp

router.post('/:id/rsvp', 
    authenticate, 
    [body('status').isIn(Object.values(RsvpStatus)).withMessage('Invalid status')],
    rsvpEvent
);

router.get('/:id/attendees', getAttendees);

router.post('/:id/checkin/:userId', 
    authenticate, 
    authorize([UserRole.ORGANIZER, UserRole.ADMIN]), 
    checkInUser
);

router.get('/my-rsvps', authenticate, getUserRsvps);

export default router;
