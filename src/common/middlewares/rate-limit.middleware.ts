import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 90, // Limit login attempts
    message: 'Too many login attempts, please try again later',
});
