/**
 * File Upload Security Types
 * Type definitions for file upload validation and security
 */

import { UserRole } from '../../modules/user/user.types';

/**
 * File signature definition for magic number validation
 */
export interface FileSignature {
  mimeType: string;
  signature: number[];
  offset?: number;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  detectedType: string | null;
  message: string;
}

/**
 * Virus scan result
 */
export interface VirusScanResult {
  isInfected: boolean;
  viruses: string[];
}

/**
 * Virus scanner status
 */
export interface ScannerStatus {
  initialized: boolean;
  enabled: boolean;
  available: boolean;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  valid: boolean;
  metadata?: ImageMetadata;
  error?: string;
}

/**
 * Image metadata (simplified from Sharp)
 */
export interface ImageMetadata {
  format?: string;
  width?: number;
  height?: number;
  channels?: number;
}

/**
 * Image optimization result
 */
export interface ImageOptimizationResult {
  valid: boolean;
  buffer?: Buffer;
  metadata?: ImageMetadata;
  error?: string;
}

/**
 * User upload statistics
 */
export interface UserUploadStats {
  limit: number;
  used: number;
  remaining: number;
  resetsIn: number;
}

/**
 * Authenticated user from request
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Upload limit configuration by role
 */
export type UploadLimitsByRole = Record<UserRole, number>;
