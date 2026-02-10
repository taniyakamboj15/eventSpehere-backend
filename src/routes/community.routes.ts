import { Router } from 'express';
import { createCommunity, joinCommunity, leaveCommunity, getCommunities, getCommunityEvents, getMyCommunities, getCommunityMembers, removeMember, inviteMember, getCommunityById } from '../modules/community/community.controller';
import { createCommunityValidation } from '../modules/community/community.validation';
import { validate } from '../common/middlewares/validate.middleware';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { UserRole } from '../modules/user/user.types';

const router = Router();

/**
 * @swagger
 * /communities:
 *   post:
 *     summary: Create a new community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tech Enthusiasts
 *               type:
 *                 type: string
 *                 enum: [public, private]
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [-122.4194, 37.7749]
 *     responses:
 *       201:
 *         description: Community created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Community'
 *       401:
 *         description: Unauthorized - requires organizer or admin role
 */
router.post('/', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), createCommunityValidation, validate, createCommunity);

/**
 * @swagger
 * /communities/{id}/join:
 *   post:
 *     summary: Join a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined community
 *       404:
 *         description: Community not found
 */
router.post('/:id/join', authenticate, joinCommunity);

/**
 * @swagger
 * /communities/{id}/leave:
 *   post:
 *     summary: Leave a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left community
 */
router.post('/:id/leave', authenticate, leaveCommunity);

/**
 * @swagger
 * /communities/my:
 *   get:
 *     summary: Get user's communities
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's communities
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
 *                     $ref: '#/components/schemas/Community'
 */
router.get('/my', authenticate, getMyCommunities);

/**
 * @swagger
 * /communities/{id}:
 *   get:
 *     summary: Get community by ID
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Community'
 *       404:
 *         description: Community not found
 */
router.get('/:id', authenticate, getCommunityById);

/**
 * @swagger
 * /communities:
 *   get:
 *     summary: Get all communities
 *     tags: [Communities]
 *     responses:
 *       200:
 *         description: List of all communities
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
 *                     $ref: '#/components/schemas/Community'
 */
router.get('/', getCommunities);

/**
 * @swagger
 * /communities/{id}/events:
 *   get:
 *     summary: Get community events
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of community events
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
 *                     $ref: '#/components/schemas/Event'
 */
router.get('/:id/events', authenticate, getCommunityEvents);

/**
 * @swagger
 * /communities/{id}/members:
 *   get:
 *     summary: Get community members
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of community members
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
 */
router.get('/:id/members', authenticate, getCommunityMembers);

/**
 * @swagger
 * /communities/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Not authorized to remove members
 */
router.delete('/:id/members/:userId', authenticate, removeMember);

/**
 * @swagger
 * /communities/{id}/invite:
 *   post:
 *     summary: Invite member to community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
router.post('/:id/invite', authenticate, inviteMember);

export default router;
