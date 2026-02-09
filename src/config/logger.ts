import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for readability in development
const consoleFormat = printf(({ level, message, timestamp, stack, 'x-request-id': requestId }) => {
    return `${timestamp} [${requestId || 'SYSTEM'}] ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }), // Support for stack traces
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json() // Default to JSON for file logs (easy parsing)
    ),
    transports: [
        // Daily rotation for error logs
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d', // Keep 14 days of logs
            maxSize: '20m',
        }),
        // Daily rotation for combined logs
        new winston.transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            maxSize: '20m',
        }),
    ],
});

// If we're not in production then log to the `console` with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            consoleFormat
        ),
    }));
}
