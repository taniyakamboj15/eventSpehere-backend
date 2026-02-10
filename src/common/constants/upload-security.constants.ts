/**
 * File Upload Security Constants
 * Centralized configuration for file upload validation
 */

// Allowed MIME types for images
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

// Allowed file extensions
export const ALLOWED_FILE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
] as const;

// File size limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MAX_FILES_PER_REQUEST = 5;

// Image dimension limits
export const MIN_IMAGE_DIMENSION = 10; // pixels
export const MAX_IMAGE_DIMENSION_DEFAULT = 10000; // pixels

// Filename constraints
export const MAX_FILENAME_LENGTH = 100;
export const FILENAME_SAFE_CHARS_REGEX = /[^a-zA-Z0-9.-]/g;
export const MULTIPLE_DOTS_REGEX = /\.+/g;
export const LEADING_DOTS_REGEX = /^\.+/;

// Virus scanner configuration
export const CLAMAV_TIMEOUT = 60000; // 60 seconds
export const CLAMAV_PREFERENCE = 'clamdscan';

// Upload rate limiting (per day)
export const UPLOAD_LIMITS_BY_ROLE = {
  ATTENDEE: 10,
  ORGANIZER: 50,
  ADMIN: 999999, // Effectively unlimited
} as const;

export const UPLOAD_LIMIT_TIME_WINDOW = 24 * 60 * 60; // 24 hours in seconds
export const UPLOAD_LIMIT_REDIS_KEY_PREFIX = 'upload_limit:';
