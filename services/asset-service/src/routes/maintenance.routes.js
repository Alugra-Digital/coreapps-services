import express from 'express';
import { schedule, complete, history } from '../controllers/maintenanceController.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get('/:assetId/history', authenticate, history);
router.post('/schedule', authenticate, schedule);
router.post('/:id/complete', authenticate, complete);

export default router;
