import { body } from 'express-validator';
import { RsvpStatus } from './rsvp.types';

export const rsvpValidation = [
    body('status').isIn(Object.values(RsvpStatus)).withMessage('Invalid status'),
];
