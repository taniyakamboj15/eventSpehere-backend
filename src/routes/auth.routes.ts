import { Router } from 'express';
import { register, login, refresh, logout, verifyEmail } from '../modules/user/auth.controller';
import { registerValidation, loginValidation } from '../modules/user/auth.validation';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/verify-email', verifyEmail);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
