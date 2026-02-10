import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { UserRole } from '../../modules/user/user.types';
import { AuthenticatedRequest } from '../../types/express';
import { env } from '../../config/env';

// Re-export for backward compatibility or direct usage
export { AuthenticatedRequest };

export interface AuthRequest extends AuthenticatedRequest {}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('No token provided'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string; role: UserRole };
        (req as AuthenticatedRequest).user = decoded;
        next();
    } catch (error) {
        next(new UnauthorizedError('Invalid token'));
    }
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string; role: UserRole };
        (req as AuthenticatedRequest).user = decoded;
        next();
    } catch (error) {
        // Continue without user if token is invalid
        next();
    }
};

export const authorize = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthenticatedRequest).user;
        if (!user || !roles.includes(user.role as UserRole)) {
            return next(new ForbiddenError('Insufficient permissions'));
        }
        next();
    };
};
