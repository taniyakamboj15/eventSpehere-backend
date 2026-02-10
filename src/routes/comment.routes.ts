import { Router } from 'express';
import { createComment, getComments, deleteComment } from '../modules/comment/comment.controller';
import { authenticate } from '../common/middlewares/auth.middleware';
import { createCommentValidation } from '../modules/comment/comment.validation';
import { validate } from '../common/middlewares/validate.middleware';


const router = Router();

/**
 * @swagger
 * /events/{id}/comments:
 *   post:
 *     summary: Create a comment on an event
 *     tags: [Comments]
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
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Great event! Looking forward to it.
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post('/:id/comments', 
    authenticate, 
    createCommentValidation,
    validate,
    createComment
);

/**
 * @swagger
 * /events/{id}/comments:
 *   get:
 *     summary: Get all comments for an event
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of comments
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       text:
 *                         type: string
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       event:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/:id/comments', getComments);

/**
 * @swagger
 * /events/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 */
router.delete('/comments/:id', authenticate, deleteComment);

export default router;
