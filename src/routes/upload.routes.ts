import { Router } from 'express';
import { uploadEventPhoto, uploadImage } from '../modules/upload/upload.controller';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { upload } from '../modules/upload/upload.middleware';
import { userUploadLimit } from '../common/middlewares/user-upload-limit.middleware';
import { validateUploadedFile } from '../common/middlewares/upload-validation.middleware';
import { UserRole } from '../modules/user/user.types';

const router = Router();

/**
 * @swagger
 * /upload/{id}/photos:
 *   post:
 *     summary: Upload event photo
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/...
 *       401:
 *         description: Unauthorized - requires organizer or admin role
 */
router.post('/:id/photos', 
    authenticate, 
    authorize([UserRole.ORGANIZER, UserRole.ADMIN]),
    userUploadLimit,
    upload.single('photo'),
    validateUploadedFile,
    uploadEventPhoto
);

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload generic image (profile, event creation, etc.)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, GIF - max 5MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/...
 *                     publicId:
 *                       type: string
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         description: Unauthorized
 */
router.post('/',
    authenticate,
    userUploadLimit,
    upload.single('file'),
    validateUploadedFile,
    uploadImage
);

export default router;
