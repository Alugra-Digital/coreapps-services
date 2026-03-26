import express from 'express';
import { getWorkOrders, getWorkOrderById, createWorkOrder, startWorkOrder, completeWorkOrder } from '../controllers/workOrderController.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { cacheMiddleware } from '../../../shared/middleware/cache.middleware.js';

const router = express.Router();

router.get('/work-orders', authenticate, cacheMiddleware(60), getWorkOrders);
router.get('/work-orders/:id', authenticate, getWorkOrderById);
router.post('/work-orders', authenticate, createWorkOrder);
router.post('/work-orders/:id/start', authenticate, startWorkOrder);
router.post('/work-orders/:id/complete', authenticate, completeWorkOrder);

export default router;
