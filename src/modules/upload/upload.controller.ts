import { Request, Response, NextFunction } from 'express';
import { Event } from '../event/event.model';
import { AppError, ForbiddenError } from '../../common/errors/app-error';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';
import { ApiResponse } from '../../common/utils/ApiResponse';

export const uploadEventPhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthenticatedRequest).user.userId;
        // multer populates req.file, we can trust it is there if middleware ran, but we check
        const file = req.file; 

        if (!file) throw new AppError('No file uploaded', 400);

        const event = await Event.findById(id);
        if (!event) throw new AppError('Event not found', 404);
        if (event.organizer.toString() !== userId) throw new ForbiddenError('Only organizer can upload photos');

        // Cloudinary storage adds these props
        const fileWithUrl = file as Express.Multer.File & { secure_url?: string; url?: string };
        event.photos.push(fileWithUrl.secure_url || fileWithUrl.url || file.path);
        await event.save();

        res.status(200).json(new ApiResponse(200, event, 'Photo uploaded successfully'));
    } catch (error) { next(error); }
};

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = req.file;
        if (!file) throw new AppError('No file uploaded', 400);

        // File is already uploaded to Cloudinary by middleware
        const fileWithUrl = file as Express.Multer.File & { secure_url?: string; url?: string; public_id?: string };
        
        res.status(200).json(new ApiResponse(200, {
            url: fileWithUrl.secure_url || fileWithUrl.url || file.path,
            publicId: fileWithUrl.public_id
        }, 'Image uploaded successfully'));
    } catch (error) { next(error); }
};
