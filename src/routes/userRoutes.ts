// ─── User Routes ───

import { Router } from 'express';
import { saveUserContext, getUserContext } from '../controllers/userContextController.js';

const router = Router();

router.post('/context', saveUserContext);
router.get('/context', getUserContext);

export default router;
