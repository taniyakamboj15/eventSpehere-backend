import { User, UpgradeStatus, UserRole } from './user.model';
import { ApiError } from '../../common/utils/ApiError';
import { emailService } from '../../services/email.service';

class UserService {
    async requestUpgrade(userId: string) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        if (user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN) {
            throw new ApiError(400, 'User is already an organizer or admin');
        }

        if (user.upgradeStatus === UpgradeStatus.PENDING) {
            throw new ApiError(400, 'Upgrade request is already pending');
        }

        user.upgradeStatus = UpgradeStatus.PENDING;
        user.upgradeRequestDate = new Date();
        await user.save();

        return user;
    }

    async getPendingRequests() {
        return await User.find({ upgradeStatus: UpgradeStatus.PENDING }).select('-passwordHash');
    }

    async approveUpgrade(userId: string) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        if (user.upgradeStatus !== UpgradeStatus.PENDING) {
            throw new ApiError(400, 'No pending upgrade request for this user');
        }

        user.role = UserRole.ORGANIZER;
        user.upgradeStatus = UpgradeStatus.APPROVED;
        // Keep request date for history or clear it? Keeping it.
        await user.save();

        // Send Email Notification
        // await emailService.sendUpgradeApprovedEmail(user.email, user.name); // To be implemented

        return user;
    }

    async rejectUpgrade(userId: string) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        if (user.upgradeStatus !== UpgradeStatus.PENDING) {
            throw new ApiError(400, 'No pending upgrade request for this user');
        }

        user.upgradeStatus = UpgradeStatus.REJECTED;
        await user.save();

        return user;
    }
}

export const userService = new UserService();
