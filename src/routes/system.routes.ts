import { Router } from 'express';
import { getHealth } from '../modules/system/health.controller';

const router = Router();

router.get('/health', getHealth);

export default router;
