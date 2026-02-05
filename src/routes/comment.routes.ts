import { createComment, getComments, deleteComment } from '../modules/comment/comment.controller';
import { authenticate } from '../common/middlewares/auth.middleware';
import { body } from 'express-validator';
import { Router } from 'express';


const router = Router();

router.post('/:id/comments', 
    authenticate, 
    [body('message').trim().notEmpty().withMessage('Message is required')],
    createComment
);

router.get('/:id/comments', getComments);

router.delete('/comments/:id', authenticate, deleteComment);

export default router;
