import { Router } from 'express';
import { rsvpEvent, getAttendees, checkInUser, getUserRsvps } from '../modules/rsvp/rsvp.controller';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { rsvpValidation } from '../modules/rsvp/rsvp.validation';
import { validate } from '../common/middlewares/validate.middleware';
import { UserRole } from '../modules/user/user.types';

const router = Router();


router.post('/:id/rsvp', 
    authenticate, 
    rsvpValidation,
    validate,
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
