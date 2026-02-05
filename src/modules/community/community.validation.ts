import { body } from 'express-validator';
import { CommunityType } from './community.types';

export const createCommunityValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(Object.values(CommunityType)).withMessage('Invalid community type'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('description').optional().isString(),
];
