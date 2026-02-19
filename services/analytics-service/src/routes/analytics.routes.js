import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
    getDashboard,
    getRevenueAnalytics,
    getHRMetrics,
    getInventoryMetrics,
    getManufacturingMetrics
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics endpoints require authentication
router.get('/dashboard', authenticate, authorize(['FINANCE_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN']), getDashboard);
router.get('/revenue', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getRevenueAnalytics);
router.get('/hr', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), getHRMetrics);
router.get('/inventory', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getInventoryMetrics);
router.get('/manufacturing', authenticate, authorize(['SUPER_ADMIN']), getManufacturingMetrics);

export default router;
