import { Request, Response, NextFunction } from 'express';
import { communityService } from './community.service';
import { eventService } from '../event/event.service';

import { ApiError } from '../../common/utils/ApiError';
import { ApiResponse } from '../../common/utils/ApiResponse';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';
import { ICommunity } from './community.types';

export const createCommunity = asyncHandler(async (req: Request, res: Response) => {
    const { name, type, description, latitude, longitude } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;

    const communityData: Partial<ICommunity> = {
        name, type, description,
        location: { type: 'Point', coordinates: [longitude, latitude] }
    };

    const community = await communityService.create(communityData, userId);

    res.status(201).json(new ApiResponse(201, community, 'Community created successfully'));
});

export const joinCommunity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    const community = await communityService.join(id, userId);
    res.status(200).json(new ApiResponse(200, community, 'Joined community successfully'));
});

export const leaveCommunity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.userId;
    const community = await communityService.leave(id, userId);
    res.status(200).json(new ApiResponse(200, community, 'Left community successfully'));
});

export const getCommunityById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const community = await communityService.getById(id);
    res.status(200).json(new ApiResponse(200, community, 'Community retrieved successfully'));
});

export const getCommunities = asyncHandler(async (req: Request, res: Response) => {
    const { longitude, latitude } = req.query;
    const lng = longitude ? parseFloat(longitude as string) : undefined;
    const lat = latitude ? parseFloat(latitude as string) : undefined;
    
    const communities = await communityService.getAll(lng, lat);
    res.status(200).json(new ApiResponse(200, communities, 'Communities retrieved successfully'));
});

export const getMyCommunities = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.userId;
    const communities = await communityService.getAllByMember(userId);
    res.status(200).json(new ApiResponse(200, communities, 'My communities retrieved'));
});

export const getCommunityEvents = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user?.userId;

  
    const communityEvents = await eventService.getEventsByCommunity(id);
    
  
    const isMember = await communityService.isMember(id, userId);

    const visibleEvents = communityEvents.filter((event) => {
        if (event.visibility === 'PUBLIC') return true;
        if (event.visibility === 'COMMUNITY_ONLY') return isMember;
        return false; 
    });

    res.status(200).json(new ApiResponse(200, visibleEvents, 'Community events retrieved'));
});

export const getCommunityMembers = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { members, admins } = await communityService.getMembers(id);
    res.status(200).json(new ApiResponse(200, { members, admins }, 'Members retrieved'));
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params;
    const requesterId = (req as AuthenticatedRequest).user.userId;

    await communityService.removeMember(id, userId, requesterId);
    res.status(200).json(new ApiResponse(200, null, 'Member removed'));
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email } = req.body;
    const requesterId = (req as AuthenticatedRequest).user.userId;

    await communityService.inviteMember(id, email, requesterId);
    res.status(200).json(new ApiResponse(200, null, 'Invitation sent'));
});
