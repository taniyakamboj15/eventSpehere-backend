import { FileSignature, FileValidationResult } from '../types/upload-security.types';

const FILE_SIGNATURES: FileSignature[] = [
  // JPEG
  {
    mimeType: 'image/jpeg',
    signature: [0xff, 0xd8, 0xff],
    offset: 0,
  },
  // PNG
  {
    mimeType: 'image/png',
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
  },
  // GIF (GIF87a)
  {
    mimeType: 'image/gif',
    signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    offset: 0,
  },
  // GIF (GIF89a)
  {
    mimeType: 'image/gif',
    signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    offset: 0,
  },
  // WebP (RIFF)
  {
    mimeType: 'image/webp',
    signature: [0x52, 0x49, 0x46, 0x46],
    offset: 0,
  },
];

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

const matchesSignature = (buffer: Buffer, signature: FileSignature): boolean => {
  const offset = signature.offset || 0;

  for (let i = 0; i < signature.signature.length; i++) {
    if (buffer[offset + i] !== signature.signature[i]) {
      return false;
    }
  }

  return true;
};


const validateWebPMarker = (buffer: Buffer): boolean => {
  for (let i = 0; i < WEBP_MARKER.length; i++) {
    if (buffer[8 + i] !== WEBP_MARKER[i]) {
      return false;
    }
  }
  return true;
};


const getSignaturesForMimeType = (mimeType: string): FileSignature[] => {
  return FILE_SIGNATURES.filter((sig) => sig.mimeType === mimeType);
};


export const validateFileSignature = (
  buffer: Buffer,
  mimeType: string
): boolean => {
  const matchingSignatures = getSignaturesForMimeType(mimeType);

  if (matchingSignatures.length === 0) {
    return false;
  }

  for (const sig of matchingSignatures) {
    if (matchesSignature(buffer, sig)) {
      // For WebP, also check for WEBP marker at offset 8
      if (mimeType === 'image/webp') {
        return validateWebPMarker(buffer);
      }
      return true;
    }
  }

  return false;
};

export const detectFileType = (buffer: Buffer): string | null => {
  for (const sig of FILE_SIGNATURES) {
    if (matchesSignature(buffer, sig)) {
      // For WebP, verify WEBP marker
      if (sig.mimeType === 'image/webp') {
        if (!validateWebPMarker(buffer)) {
          continue;
        }
      }
      return sig.mimeType;
    }
  }

  return null;
};


export const validateFile = (
  buffer: Buffer,
  declaredMimeType: string
): FileValidationResult => {
  const detectedType = detectFileType(buffer);

  if (!detectedType) {
    return {
      valid: false,
      detectedType: null,
      message: 'Unknown or unsupported file type',
    };
  }

  if (detectedType !== declaredMimeType) {
    return {
      valid: false,
      detectedType,
      message: `File signature mismatch. Declared: ${declaredMimeType}, Detected: ${detectedType}`,
    };
  }

  return {
    valid: true,
    detectedType,
    message: 'File signature validated successfully',
  };
};
