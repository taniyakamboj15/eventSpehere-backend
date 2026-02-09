import { Router } from 'express';
import { createComment, getComments, deleteComment } from '../modules/comment/comment.controller';
import { authenticate } from '../common/middlewares/auth.middleware';
import { createCommentValidation } from '../modules/comment/comment.validation';
import { validate } from '../common/middlewares/validate.middleware';


const router = Router();

router.post('/:id/comments', 
    authenticate, 
    createCommentValidation,
    validate,
    createComment
);

router.get('/:id/comments', getComments);

router.delete('/comments/:id', authenticate, deleteComment);

export default router;
