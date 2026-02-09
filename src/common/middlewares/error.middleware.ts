import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof Error) {
    const statusCode = ('statusCode' in err && typeof (err as { statusCode: unknown }).statusCode === 'number')
      ? (err as { statusCode: number }).statusCode
      : 500;
    error = new ApiError(statusCode, err.message, [], err.stack);
  } else {
       error = new ApiError(500, 'Something went wrong');
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  };

  if (process.env.NODE_ENV === 'development') {
      console.error('Error:', err);
  }

  res.status(error.statusCode).json(response);
};
