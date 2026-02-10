import { Router } from 'express';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { UserRole } from '../modules/user/user.types';
import { requestUpgrade, getPendingRequests, approveUpgrade, rejectUpgrade } from '../modules/user/user.controller';

const router = Router();

/**
 * @swagger
 * /users/upgrade-request:
 *   post:
 *     summary: Request upgrade to organizer role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upgrade request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Upgrade request submitted successfully
 *       400:
 *         description: Request already pending or user is already an organizer
 */
router.post('/upgrade-request', authenticate, requestUpgrade);

/**
 * @swagger
 * /users/admin/upgrade-requests:
 *   get:
 *     summary: Get all pending upgrade requests (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending upgrade requests
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - admin role required
 */
router.get('/admin/upgrade-requests', 
    authenticate,
    authorize([UserRole.ADMIN]),
    getPendingRequests
);

/**
 * @swagger
 * /users/admin/upgrade-requests/{userId}/approve:
 *   post:
 *     summary: Approve upgrade request (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to approve
 *     responses:
 *       200:
 *         description: Upgrade request approved successfully
 *       401:
 *         description: Unauthorized - admin role required
 *       404:
 *         description: User or upgrade request not found
 */
router.post('/admin/upgrade-requests/:userId/approve', 
    authenticate,
    authorize([UserRole.ADMIN]),
    approveUpgrade
);

/**
 * @swagger
 * /users/admin/upgrade-requests/{userId}/reject:
 *   post:
 *     summary: Reject upgrade request (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to reject
 *     responses:
 *       200:
 *         description: Upgrade request rejected successfully
 *       401:
 *         description: Unauthorized - admin role required
 *       404:
 *         description: User or upgrade request not found
 */
router.post('/admin/upgrade-requests/:userId/reject', 
    authenticate,
    authorize([UserRole.ADMIN]),
    rejectUpgrade
);

export default router;
