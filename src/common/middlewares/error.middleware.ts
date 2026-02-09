import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

interface ErrorConverter {
  check: (err: unknown) => boolean;
  convert: (err: unknown) => ApiError;
}

const ERROR_CONVERTERS: ErrorConverter[] = [
  {
    check: (err) => err instanceof ApiError,
    convert: (err) => err as ApiError
  },
  {
    check: (err) => err instanceof Error,
    convert: (err) => {
      const error = err as Error;
      const statusCode = ('statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number')
        ? (error as { statusCode: number }).statusCode
        : 500;
      return new ApiError(statusCode, error.message, [], error.stack);
    }
  }
];

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  const converter = ERROR_CONVERTERS.find(c => c.check(err));
  const error = converter ? converter.convert(err) : new ApiError(500, 'Something went wrong');

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
