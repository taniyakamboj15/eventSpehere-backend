

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { validateFileSignature } from '../utils/file-signature';
import { scanFileBuffer } from '../utils/virus-scanner';
import { validateImage } from '../utils/image-validator';
import { logger } from '../../config/logger';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_REQUEST,
  MAX_FILENAME_LENGTH,
  FILENAME_SAFE_CHARS_REGEX,
  MULTIPLE_DOTS_REGEX,
  LEADING_DOTS_REGEX,
} from '../constants/upload-security.constants';
import { ImageMetadata } from '../types/upload-security.types';


interface RequestWithImageMetadata extends Request {
  imageMetadata?: ImageMetadata;
}

const isAllowedMimeType = (mimeType: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType as typeof ALLOWED_IMAGE_TYPES[number]);
};


const getFileExtension = (filename: string): string | undefined => {
  return filename.split('.').pop()?.toLowerCase();
};

const isAllowedExtension = (extension: string | undefined): boolean => {
  if (!extension) return false;
  return ALLOWED_FILE_EXTENSIONS.includes(extension as typeof ALLOWED_FILE_EXTENSIONS[number]);
};


const hasDoubleExtension = (filename: string): boolean => {
  const parts = filename.split('.');
  return parts.length > 2;
};

export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (!isAllowedMimeType(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      )
    );
  }

  const ext = getFileExtension(file.originalname);
  if (!isAllowedExtension(ext)) {
    return cb(
      new ApiError(
        400,
        `Invalid file extension. Allowed extensions: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
      )
    );
  }

  if (hasDoubleExtension(file.originalname)) {
    return cb(new ApiError(400, 'Invalid filename: multiple extensions detected'));
  }

  cb(null, true);
};

export const uploadLimits = {
  fileSize: MAX_FILE_SIZE,
  files: MAX_FILES_PER_REQUEST,
};


export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(FILENAME_SAFE_CHARS_REGEX, '_') // Replace special chars
    .replace(MULTIPLE_DOTS_REGEX, '.') // Remove multiple dots
    .replace(LEADING_DOTS_REGEX, '') // Remove leading dots
    .substring(0, MAX_FILENAME_LENGTH); // Limit length
};

const validateSignature = (buffer: Buffer, mimeType: string): void => {
  logger.info('Checking file signature...');
  const isValidSignature = validateFileSignature(buffer, mimeType);

  if (!isValidSignature) {
    throw new ApiError(
      400,
      'File signature validation failed. The file content does not match its declared type.'
    );
  }
};

const scanForViruses = async (buffer: Buffer, filename: string): Promise<void> => {
  logger.info('Scanning for viruses...');
  const scanResult = await scanFileBuffer(buffer, filename);

  if (scanResult.isInfected) {
    logger.error(`Virus detected in file ${filename}:`, scanResult.viruses);
    throw new ApiError(
      400,
      `File rejected: Virus detected (${scanResult.viruses.join(', ')})`
    );
  }
};

const validateImageIntegrity = async (
  buffer: Buffer,
  filename: string,
  req: RequestWithImageMetadata
): Promise<void> => {
  logger.info('Validating image integrity...');
  const imageValidation = await validateImage(buffer, filename);

  if (!imageValidation.valid) {
    throw new ApiError(400, `Image validation failed: ${imageValidation.error}`);
  }


  req.imageMetadata = imageValidation.metadata;
};

const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const validateUploadedFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      return next();
    }

    logger.info(`Performing advanced validation for file: ${file.originalname}`);

    
      if (!file.buffer) {

      logger.warn('File buffer not available - skipping deep validation');
      return next();
    }

    const buffer = file.buffer;

    validateSignature(buffer, file.mimetype);

    await scanForViruses(buffer, file.originalname);

    if (isImageFile(file.mimetype)) {
      await validateImageIntegrity(buffer, file.originalname, req as RequestWithImageMetadata);
    }

    logger.info(`File ${file.originalname} passed all security checks`);
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('File validation error:', error);
      next(new ApiError(500, 'File validation failed'));
    }
  }
};
