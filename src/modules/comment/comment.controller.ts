import { Request, Response, NextFunction } from 'express';
import { commentService } from './comment.service';
import { Types } from 'mongoose';
import { body, validationResult } from 'express-validator';
import { ApiError } from '../../common/utils/ApiError';
import { ApiResponse } from '../../common/utils/ApiResponse';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

    const { id } = req.params; // eventId
    const userId = (req as AuthenticatedRequest).user.userId;
    const { message, parentId } = req.body;

    const comment = await commentService.create({
        event: new Types.ObjectId(id),
        user: new Types.ObjectId(userId),
        message,
        parentId: parentId ? new Types.ObjectId(parentId) : undefined
    } as Partial<import('../comment/comment.types').IComment>);
    res.status(201).json(new ApiResponse(201, comment, 'Comment posted successfully'));
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await commentService.getByEvent(id, page, limit);
    res.status(200).json(new ApiResponse(200, result, 'Comments retrieved successfully'));
});
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params; // commentId
    const { userId, role } = (req as AuthenticatedRequest).user;

    await commentService.delete(id, userId, role);
    res.status(200).json(new ApiResponse(200, null, 'Comment deleted successfully'));
});
