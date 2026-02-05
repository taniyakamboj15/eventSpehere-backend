import { body, query } from 'express-validator';
import { EventCategory, EventVisibility, RecurringRule } from './event.types';

export const createEventValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(Object.values(EventCategory)).withMessage('Invalid event category'),
    body('visibility').isIn(Object.values(EventVisibility)).withMessage('Invalid visibility'),
    body('startDateTime').isISO8601().withMessage('Invalid start date/time format').toDate(),
    body('endDateTime').isISO8601().withMessage('Invalid end date/time format').toDate(),
    body('address').notEmpty().withMessage('Address is required'),
    body('latitude').isFloat().withMessage('Latitude must be a valid number'),
    body('longitude').isFloat().withMessage('Longitude must be a valid number'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('communityId').optional().isMongoId().withMessage('Invalid community ID'),
    body('recurringRule').optional().isIn(Object.values(RecurringRule)).withMessage('Invalid recurring rule'),
    body('photos').optional().isArray().withMessage('Photos must be an array'),
];

export const getEventsValidation = [
    query('latitude').optional().isFloat(),
    query('longitude').optional().isFloat(),
    query('category').optional().isIn(Object.values(EventCategory)),
];
