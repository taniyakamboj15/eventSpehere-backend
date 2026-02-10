import NodeClam from 'clamscan';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { VirusScanResult, ScannerStatus } from '../types/upload-security.types';
import { CLAMAV_TIMEOUT, CLAMAV_PREFERENCE } from '../constants/upload-security.constants';

let clamScanner: NodeClam | null = null;
let scannerInitialized = false;
let scannerEnabled = true;


const shouldEnableScanner = (): boolean => {
  return env.CLAMAV_ENABLED === true;
};


const isDevelopmentMode = (): boolean => {
  return env.NODE_ENV === 'development';
};


const handleInitializationFailure = (error: unknown): void => {
  logger.error('Failed to initialize ClamAV scanner:', error);

  if (isDevelopmentMode()) {
    logger.warn('ClamAV not available - virus scanning disabled in development');
    scannerEnabled = false;
    scannerInitialized = true;
  } else {
    throw new Error('ClamAV scanner initialization failed in production');
  }
};

/**
 * Create ClamAV scanner instance
 */
const createScannerInstance = async (): Promise<NodeClam> => {
  const ClamScan = NodeClam;
  return await new ClamScan().init({
    clamdscan: {
      host: env.CLAMAV_HOST,
      port: env.CLAMAV_PORT,
      timeout: CLAMAV_TIMEOUT,
      localFallback: false,
    },
    preference: CLAMAV_PREFERENCE,
  });
};

/**
 * Initialize ClamAV scanner
 */
export const initializeScanner = async (): Promise<void> => {
  if (scannerInitialized) {
    return;
  }

  try {
    if (!shouldEnableScanner()) {
      logger.warn('ClamAV virus scanning is disabled');
      scannerEnabled = false;
      scannerInitialized = true;
      return;
    }

    clamScanner = await createScannerInstance();
    scannerInitialized = true;
    scannerEnabled = true;
    logger.info('ClamAV scanner initialized successfully');
  } catch (error) {
    handleInitializationFailure(error);
  }
};

/**
 * Handle scan failure
 */
const handleScanFailure = (error: unknown, filename: string): VirusScanResult => {
  logger.error(`Error scanning file ${filename}:`, error);

  if (!isDevelopmentMode()) {
    throw new Error('Virus scan failed');
  }

  logger.warn('Virus scan failed - allowing file in development mode');
  return { isInfected: false, viruses: [] };
};

/**
 * Perform virus scan on buffer
 */
const performScan = async (
  scanner: NodeClam,
  buffer: Buffer,
  filename: string
): Promise<VirusScanResult> => {
  logger.info(`Scanning file: ${filename} (${buffer.length} bytes)`);

  const result = await scanner.scanStream(buffer);
  const isInfected = result.isInfected;
  const viruses = result.viruses || [];

  if (isInfected) {
    logger.warn(`Virus detected in ${filename}:`, viruses);
  } else {
    logger.info(`File ${filename} is clean`);
  }

  return { isInfected, viruses };
};

/**
 * Handle scanner unavailable scenario
 */
const handleScannerUnavailable = (filename: string): VirusScanResult => {
  logger.error('ClamAV scanner not available');

  if (!isDevelopmentMode()) {
    throw new Error('Virus scanner unavailable');
  }

  logger.warn(`Virus scan skipped for ${filename} - scanner unavailable in development`);
  return { isInfected: false, viruses: [] };
};

/**
 * Scan file buffer for viruses
 */
export const scanFileBuffer = async (
  buffer: Buffer,
  filename: string
): Promise<VirusScanResult> => {
  if (!scannerInitialized) {
    await initializeScanner();
  }

  if (!scannerEnabled) {
    logger.warn(`Virus scan skipped for ${filename} - scanner disabled`);
    return { isInfected: false, viruses: [] };
  }

  if (!clamScanner) {
    return handleScannerUnavailable(filename);
  }

  try {
    return await performScan(clamScanner, buffer, filename);
  } catch (error) {
    return handleScanFailure(error, filename);
  }
};

/**
 * Check if scanner is available and ready
 */
export const isScannerAvailable = (): boolean => {
  return scannerInitialized && scannerEnabled && clamScanner !== null;
};

/**
 * Get scanner status for health checks
 */
export const getScannerStatus = (): ScannerStatus => {
  return {
    initialized: scannerInitialized,
    enabled: scannerEnabled,
    available: isScannerAvailable(),
  };
};
