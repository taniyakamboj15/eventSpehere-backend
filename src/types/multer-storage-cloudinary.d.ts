declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { v2 as cloudinary } from 'cloudinary';

  export interface Options {
    cloudinary: typeof cloudinary;
    folder?: string;
    allowedFormats?: string[];
    params?: {
      folder?: string;
      allowed_formats?: string[];
      transformation?: Array<Object>;
      [key: string]: unknown;
    } | ((req: unknown, file: unknown) => unknown);
  }

  function CloudinaryStorage(options: Options): StorageEngine;
  export = CloudinaryStorage;
}
