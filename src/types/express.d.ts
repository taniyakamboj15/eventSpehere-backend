import { IUser } from '../modules/user/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      } | any; // Keep any temporarily for compatibility if needed, but aim for strict
    }
  }
}

export interface AuthenticatedRequest extends Express.Request {
    user: {
        userId: string;
        email: string;
        role: string;
    };
}
