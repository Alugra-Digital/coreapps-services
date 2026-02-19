import express from 'express';
import { createInspection, updateStatus } from '../controllers/qualityController.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.post('/quality-inspections', authenticate, createInspection);
router.patch('/quality-inspections/:id', authenticate, updateStatus);

export default router;
