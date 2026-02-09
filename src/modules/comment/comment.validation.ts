import { body } from 'express-validator';

export const createCommentValidation = [
    body('message').trim().notEmpty().withMessage('Message is required'),
];
