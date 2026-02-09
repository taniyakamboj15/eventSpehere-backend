import { UserRole } from '../modules/user/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export interface AuthenticatedRequest extends Express.Request {
    user: {
        userId: string;
        email: string;
        role: UserRole;
    };
}
