declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { v2 as cloudinary } from 'cloudinary';

  export interface Options {
    cloudinary: any;
    folder?: string;
    allowedFormats?: string[];
    params?: {
      folder?: string;
      allowed_formats?: string[];
      transformation?: Array<Object>;
      [key: string]: any;
    } | ((req: any, file: any) => any);
  }

  function CloudinaryStorage(options: Options): StorageEngine;
  export = CloudinaryStorage;
}
