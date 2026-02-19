import express from 'express';
import { createBOM, getBOMTree } from '../controllers/bomController.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.post('/boms', authenticate, createBOM);
router.get('/boms/:id/tree', authenticate, getBOMTree);

export default router;
