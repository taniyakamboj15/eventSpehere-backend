import sharp from 'sharp';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import {
  ImageValidationResult,
  ImageOptimizationResult,
  ImageMetadata,
} from '../types/upload-security.types';
import {
  MIN_IMAGE_DIMENSION,
  MAX_IMAGE_DIMENSION_DEFAULT,
} from '../constants/upload-security.constants';

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif'] as const;
type SupportedFormat = typeof SUPPORTED_FORMATS[number];

const getMaxDimension = (): number => {
  return env.MAX_IMAGE_DIMENSION || MAX_IMAGE_DIMENSION_DEFAULT;
};


const isSupportedFormat = (format: string | undefined): format is SupportedFormat => {
  if (!format) return false;
  return SUPPORTED_FORMATS.includes(format as SupportedFormat);
};


const validateDimensionsExist = (
  metadata: sharp.Metadata
): { valid: boolean; error?: string } => {
  if (!metadata.width || !metadata.height) {
    return {
      valid: false,
      error: 'Unable to determine image dimensions',
    };
  }
  return { valid: true };
};


const validateMinimumDimensions = (
  width: number,
  height: number
): { valid: boolean; error?: string } => {
  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    return {
      valid: false,
      error: `Image too small. Minimum dimensions: ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}`,
    };
  }
  return { valid: true };
};

/**
 * Validate maximum dimensions
 */
const validateMaximumDimensions = (
  width: number,
  height: number
): { valid: boolean; error?: string } => {
  const maxDimension = getMaxDimension();
  if (width > maxDimension || height > maxDimension) {
    return {
      valid: false,
      error: `Image too large. Maximum dimensions: ${maxDimension}x${maxDimension}`,
    };
  }
  return { valid: true };
};

/**
 * Validate image format
 */
const validateFormat = (
  format: string | undefined
): { valid: boolean; error?: string } => {
  if (!format) {
    return {
      valid: false,
      error: 'Unable to determine image format',
    };
  }

  if (!isSupportedFormat(format)) {
    return {
      valid: false,
      error: `Unsupported image format: ${format}`,
    };
  }

  return { valid: true };
};

/**
 * Validate image color channels
 */
const validateColorChannels = async (
  buffer: Buffer
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const stats = await sharp(buffer).stats();

    if (!stats.channels || stats.channels.length === 0) {
      return {
        valid: false,
        error: 'Invalid image: no color channels detected',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image channels',
    };
  }
};

/**
 * Read image metadata
 */
const readImageMetadata = async (buffer: Buffer): Promise<sharp.Metadata> => {
  return await sharp(buffer).metadata();
};

/**
 * Log validation success
 */
const logValidationSuccess = (filename: string, metadata: sharp.Metadata): void => {
  logger.info(
    `Image validated: ${filename} (${metadata.width}x${metadata.height}, ${metadata.format})`
  );
};

/**
 * Log validation failure
 */
const logValidationFailure = (filename: string, error: unknown): void => {
  logger.error(`Image validation failed for ${filename}:`, error);
};

/**
 * Validate image buffer using Sharp
 */
export const validateImage = async (
  buffer: Buffer,
  filename: string
): Promise<ImageValidationResult> => {
  try {
    logger.info(`Validating image: ${filename}`);

    const metadata = await readImageMetadata(buffer);

    // Validate format
    const formatCheck = validateFormat(metadata.format);
    if (!formatCheck.valid) {
      return { valid: false, error: formatCheck.error };
    }

    // Validate dimensions exist
    const dimensionsCheck = validateDimensionsExist(metadata);
    if (!dimensionsCheck.valid) {
      return { valid: false, error: dimensionsCheck.error };
    }

    const { width, height } = metadata;

    // Validate minimum dimensions
    const minCheck = validateMinimumDimensions(width!, height!);
    if (!minCheck.valid) {
      return { valid: false, error: minCheck.error };
    }

    // Validate maximum dimensions
    const maxCheck = validateMaximumDimensions(width!, height!);
    if (!maxCheck.valid) {
      return { valid: false, error: maxCheck.error };
    }

    // Validate color channels
    const channelsCheck = await validateColorChannels(buffer);
    if (!channelsCheck.valid) {
      return { valid: false, error: channelsCheck.error };
    }

    logValidationSuccess(filename, metadata);

    return {
      valid: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
      },
    };
  } catch (error) {
    logValidationFailure(filename, error);

    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Image validation failed',
    };
  }
};


const optimizeImageBuffer = async (buffer: Buffer): Promise<Buffer> => {
  return await sharp(buffer)
    .rotate()
    .withMetadata()
    .toBuffer();
};


const handleOptimizationFailure = (
  filename: string,
  error: unknown,
  originalBuffer: Buffer,
  metadata: ImageMetadata
): ImageOptimizationResult => {
  logger.error(`Image optimization failed for ${filename}:`, error);

  return {
    valid: true,
    buffer: originalBuffer,
    metadata,
  };
};

/**
 * Validate and optimize image
 */
export const validateAndOptimizeImage = async (
  buffer: Buffer,
  filename: string
): Promise<ImageOptimizationResult> => {
  const validation = await validateImage(buffer, filename);

  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
    };
  }

  try {
    const optimized = await optimizeImageBuffer(buffer);

    return {
      valid: true,
      buffer: optimized,
      metadata: validation.metadata,
    };
  } catch (error) {
    return handleOptimizationFailure(filename, error, buffer, validation.metadata!);
  }
};
