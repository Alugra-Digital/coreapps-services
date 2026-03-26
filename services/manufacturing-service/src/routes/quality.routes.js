import express from 'express';
import { getInspections, createInspection, updateStatus } from '../controllers/qualityController.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get('/quality-inspections', authenticate, getInspections);
router.post('/quality-inspections', authenticate, createInspection);
router.patch('/quality-inspections/:id', authenticate, updateStatus);

export default router;
