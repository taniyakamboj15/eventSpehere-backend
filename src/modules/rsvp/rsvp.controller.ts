import { Request, Response, NextFunction } from 'express';
import { rsvpService } from './rsvp.service';
import { ApiError } from '../../common/utils/ApiError';
import { ApiResponse } from '../../common/utils/ApiResponse';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';

export const rsvpEvent = asyncHandler(async (req: Request, res: Response) => {
    
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    const { status } = req.body;

    const rsvp = await rsvpService.createOrUpdate(id, userId, status);
    res.status(200).json(new ApiResponse(200, rsvp, 'RSVP updated successfully'));
});

export const getAttendees = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const attendees = await rsvpService.getAttendees(id);
    res.status(200).json(new ApiResponse(200, attendees, 'Attendees retrieved successfully'));
});

export const checkInUser = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params; // id=eventId, userId=attendeeId
    const organizerId = (req as AuthenticatedRequest).user.userId;
    
    const rsvp = await rsvpService.checkIn(id, { userId }, organizerId);
    res.status(200).json(new ApiResponse(200, rsvp, 'User checked in successfully'));
});

export const getUserRsvps = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.userId;
    const rsvps = await rsvpService.getUserRsvps(userId);
    res.status(200).json(new ApiResponse(200, rsvps, 'User RSVPs retrieved successfully'));
});
