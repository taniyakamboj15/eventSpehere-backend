import { Router } from 'express';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { UserRole } from '../modules/user/user.types';
import { requestUpgrade, getPendingRequests, approveUpgrade, rejectUpgrade } from '../modules/user/user.controller';

const router = Router();

// User routes
router.post('/upgrade-request', authenticate, requestUpgrade);

// Admin routes
router.get('/admin/upgrade-requests', 
    authenticate, 
    authorize([UserRole.ADMIN]), 
    getPendingRequests
);

router.post('/admin/upgrade-requests/:userId/approve', 
    authenticate, 
    authorize([UserRole.ADMIN]), 
    approveUpgrade
);

router.post('/admin/upgrade-requests/:userId/reject', 
    authenticate, 
    authorize([UserRole.ADMIN]), 
    rejectUpgrade
);

export default router;
