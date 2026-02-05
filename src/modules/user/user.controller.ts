import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiResponse } from '../../common/utils/ApiResponse';
import { userService } from './user.service';
import { AuthRequest } from '../../common/middlewares/auth.middleware';

export const requestUpgrade = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user!.userId;
    const user = await userService.requestUpgrade(userId);
    res.status(200).json(new ApiResponse(200, user, 'Upgrade request submitted successfully'));
});

export const getPendingRequests = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getPendingRequests();
    res.status(200).json(new ApiResponse(200, users, 'Pending requests fetched successfully'));
});

export const approveUpgrade = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = await userService.approveUpgrade(userId);
    res.status(200).json(new ApiResponse(200, user, 'User upgraded to Organizer successfully'));
});

export const rejectUpgrade = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = await userService.rejectUpgrade(userId);
    res.status(200).json(new ApiResponse(200, user, 'Upgrade request rejected'));
});
