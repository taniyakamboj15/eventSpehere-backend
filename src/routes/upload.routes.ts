import { Router } from 'express';
import { uploadEventPhoto, uploadImage } from '../modules/upload/upload.controller';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';
import { upload } from '../modules/upload/upload.middleware';
import { UserRole } from '../modules/user/user.types';

const router = Router();

router.post('/:id/photos', 
    authenticate, 
    authorize([UserRole.ORGANIZER, UserRole.ADMIN]),
    upload.single('photo'), 
    uploadEventPhoto
);

// Generic upload for Event creation, Profile pics, etc.
router.post('/',
    authenticate,
    upload.single('file'), // Frontend sends 'file'
    uploadImage
);

export default router;
