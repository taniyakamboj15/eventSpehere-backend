import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  
  // Database Configuration
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  
  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_URL: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  
  // Email Configuration
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_SECURE: z.string().default('false').transform(val => val === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('no-reply@eventsphere.com'),
  
  // Client Configuration
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // App Info
  APP_NAME: z.string().default('EventSphere'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // File Upload Security
  CLAMAV_ENABLED: z.string().default('false').transform(val => val === 'true'),
  CLAMAV_HOST: z.string().default('localhost'),
  CLAMAV_PORT: z.string().default('3310').transform(Number),
  MAX_IMAGE_DIMENSION: z.string().default('10000').transform(Number),
});

export type Env = z.infer<typeof envSchema> & {
  CLAMAV_ENABLED: boolean;
  CLAMAV_PORT: number;
  MAX_IMAGE_DIMENSION: number;
};

/**
 * Validates and parses environment variables
 * Exits the process if validation fails
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Log successful validation in development
    if (parsed.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully');
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set correctly.');
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
    }
    process.exit(1);
  }
}

// Validate and export environment variables
export const env = validateEnv();
