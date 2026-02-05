import { Notification, INotification, NotificationStatus, NotificationType } from './notification.model';
import { User } from '../../user/user.model';

export class NotificationService {
    

    async create(
        email: string,
        type: NotificationType,
        title: string,
        message: string,
        data?: Record<string, unknown>
    ): Promise<INotification> {
        const user = await User.findOne({ email });
        
        return Notification.create({
            recipient: user ? user._id : undefined,
            recipientEmail: email,
            type,
            title,
            message,
            data,
            status: user ? NotificationStatus.DELIVERED : NotificationStatus.PENDING
        });
    }

    async getUserNotifications(userId: string) {
        return Notification.find({ recipient: userId }).sort({ createdAt: -1 });
    }

    async getUnreadCount(userId: string) {
        return Notification.countDocuments({ recipient: userId, isRead: false });
    }

    async markAsRead(notificationId: string, userId: string) {
        return Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId }, // Ensure ownership
            { isRead: true },
            { new: true }
        );
    }

    async markAllAsRead(userId: string) {
        return Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
    }

    async claimPendingNotifications(userId: string, email: string) {
        await Notification.updateMany(
            { recipientEmail: email, status: NotificationStatus.PENDING },
            { 
                recipient: userId, 
                status: NotificationStatus.DELIVERED 
            }
        );
    }
}

export const notificationService = new NotificationService();
