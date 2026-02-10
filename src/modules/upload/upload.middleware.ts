import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import CloudinaryStorage from 'multer-storage-cloudinary';
import { env } from '../../config/env';
import { sanitizeFilename } from '../../common/middlewares/upload-validation.middleware';

if (!cloudinary.config().cloud_name) {
    cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET
    });
}

const storage = CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'eventsphere',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
        public_id: (req: any, file: Express.Multer.File) => {
            // Sanitize filename and use as public_id
            const sanitized = sanitizeFilename(file.originalname);
            const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
            return `${Date.now()}-${nameWithoutExt}`;
        },
    },
});

export const upload = multer({ storage: storage });
