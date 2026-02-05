import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { validationResult } from 'express-validator';
import { ApiError } from '../../common/utils/ApiError';
import { ApiResponse } from '../../common/utils/ApiResponse';
import { asyncHandler } from '../../common/utils/asyncHandler';
import jwt from 'jsonwebtoken';
import { notificationService } from '../notification/in-app/notification.service';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

import { IUser } from './user.types';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation Error', errors.array());
    }

    const { name, email, password, role } = req.body;
    // Construct Partial<IUser> explicitly or trust service to handle it
    await authService.register({ name, email, passwordHash: password, role } as Partial<IUser>);

    res.status(201).json(
        new ApiResponse(201, null, 'Registration successful. Please check your email for the verification code.')
    );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         throw new ApiError(400, 'Validation Error', errors.array());
    }

    const { email, password } = req.body;
    const { user, tokens } = await authService.login(email, password);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    res.status(200).json(
         new ApiResponse(200, {
             user: { id: user._id, name: user.name, email: user.email, role: user.role },
             accessToken: tokens.accessToken
         }, 'Logged in successfully')
    );
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new ApiError(401, 'Refresh token missing');
    }

    const { user, tokens } = await authService.refreshToken(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    
    res.status(200).json(
        new ApiResponse(200, { 
            accessToken: tokens.accessToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        }, 'Token refreshed')
    );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;
    if (!email || !token) {
        throw new ApiError(400, 'Email and token are required');
    }

    const { user, tokens } = await authService.verifyEmail(email, token);

    
    await notificationService.claimPendingNotifications(user._id.toString(), user.email);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    res.status(200).json(new ApiResponse(200, {
             user: { id: user._id, name: user.name, email: user.email, role: user.role },
             accessToken: tokens.accessToken
     }, 'Email verified and logged in successfully'));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        try {
            const decoded = jwt.decode(refreshToken) as { userId: string };
            if (decoded && decoded.userId) {
                await authService.logout(decoded.userId, refreshToken);
            }
        } catch (ignore) {
            // Token invalid, just clear cookie
        }
    }
    
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});
