import { Router } from 'express';
import { createCommunity, joinCommunity, leaveCommunity, getCommunities, getCommunityEvents, getMyCommunities, getCommunityMembers, removeMember, inviteMember, getCommunityById } from '../modules/community/community.controller';
import { createCommunityValidation } from '../modules/community/community.validation';
import { validate } from '../common/middlewares/validate.middleware';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { UserRole } from '../modules/user/user.types';

const router = Router();

router.post('/', authenticate, authorize([UserRole.ORGANIZER, UserRole.ADMIN]), createCommunityValidation, validate, createCommunity);
router.post('/:id/join', authenticate, joinCommunity);
router.post('/:id/leave', authenticate, leaveCommunity);
router.get('/my', authenticate, getMyCommunities);
router.get('/:id', authenticate, getCommunityById);
router.get('/', getCommunities);
router.get('/:id/events', authenticate, getCommunityEvents);
router.get('/:id/members', authenticate, getCommunityMembers);
router.delete('/:id/members/:userId', authenticate, removeMember);
router.post('/:id/invite', authenticate, inviteMember);

export default router;
