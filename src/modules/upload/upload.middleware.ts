import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import CloudinaryStorage from 'multer-storage-cloudinary';

if (!cloudinary.config().cloud_name) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const storage = CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'eventsphere',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

export const upload = multer({ storage: storage });
