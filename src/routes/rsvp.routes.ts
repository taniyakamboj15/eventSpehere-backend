import { Router } from 'express';
import { rsvpEvent, getAttendees, checkInUser, getUserRsvps } from '../modules/rsvp/rsvp.controller';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { rsvpValidation } from '../modules/rsvp/rsvp.validation';
import { validate } from '../common/middlewares/validate.middleware';
import { UserRole } from '../modules/user/user.types';

const router = Router();

/**
 * @swagger
 * /events/{id}/rsvp:
 *   post:
 *     summary: RSVP to an event
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [going, maybe, not_going]
 *                 example: going
 *     responses:
 *       200:
 *         description: RSVP successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/RSVP'
 *       400:
 *         description: Event is full or invalid status
 *       404:
 *         description: Event not found
 */
router.post('/:id/rsvp', 
    authenticate, 
    rsvpValidation,
    validate,
    rsvpEvent
);

/**
 * @swagger
 * /events/{id}/attendees:
 *   get:
 *     summary: Get event attendees
 *     tags: [RSVPs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of event attendees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RSVP'
 */
router.get('/:id/attendees', getAttendees);

/**
 * @swagger
 * /events/{id}/checkin/{userId}:
 *   post:
 *     summary: Check in user to event
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check in
 *     responses:
 *       200:
 *         description: User checked in successfully
 *       401:
 *         description: Unauthorized - requires organizer or admin role
 *       404:
 *         description: RSVP not found
 */
router.post('/:id/checkin/:userId', 
    authenticate, 
    authorize([UserRole.ORGANIZER, UserRole.ADMIN]), 
    checkInUser
);

/**
 * @swagger
 * /events/my-rsvps:
 *   get:
 *     summary: Get user's RSVPs
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's RSVPs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RSVP'
 */
router.get('/my-rsvps', authenticate, getUserRsvps);

export default router;
