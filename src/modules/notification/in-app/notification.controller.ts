import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { AppError } from '../../../common/errors/app-error';
import { ApiResponse } from '../../../common/utils/ApiResponse';
import { AuthRequest } from '../../../common/middlewares/auth.middleware';

export class NotificationController {
    
    async getMyNotifications(req: Request, res: Response) {
        const user = (req as AuthRequest).user;
        if (!user) throw new AppError('Unauthorized', 401);
        
        const notifications = await notificationService.getUserNotifications(user.userId);
        const unreadCount = await notificationService.getUnreadCount(user.userId);
        
        res.status(200).json(new ApiResponse(200, { notifications, unreadCount }, 'Notifications retrieved'));
    }

    async markAsRead(req: Request, res: Response) {
        const user = (req as AuthRequest).user;
        if (!user) throw new AppError('Unauthorized', 401);
        const { id } = req.params;

        const updated = await notificationService.markAsRead(id, user.userId);
        if (!updated) throw new AppError('Notification not found or access denied', 404);

        res.status(200).json(new ApiResponse(200, updated, 'Marked as read'));
    }

    async markAllAsRead(req: Request, res: Response) {
        const user = (req as AuthRequest).user;
        if (!user) throw new AppError('Unauthorized', 401);

        await notificationService.markAllAsRead(user.userId);
        res.status(200).json(new ApiResponse(200, null, 'All marked as read'));
    }
}

export const notificationController = new NotificationController();
