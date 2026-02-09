import { Router } from 'express';
import { register, login, refresh, logout, verifyEmail } from '../modules/user/auth.controller';
import { registerValidation, loginValidation } from '../modules/user/auth.validation';
import { validate } from '../common/middlewares/validate.middleware';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/verify-email', verifyEmail);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
