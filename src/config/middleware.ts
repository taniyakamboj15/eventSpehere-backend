import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { limiter } from '../common/middlewares/rate-limit.middleware';

export const configureMiddlewares = (app: Express) => {
    // Security Middlewares
    app.use(helmet());
    app.use(limiter);
    app.use(mongoSanitize());
    
    app.use(cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
    }));

    // Body Parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
};
