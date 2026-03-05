import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
    getDashboard,
    getRevenueAnalytics,
    getHRMetrics,
    getInventoryMetrics,
    getManufacturingMetrics,
    getSales,
    getSalesByEmployees,
    getSalesByEmployeeId,
    getSalesFunnel,
    getSalesTargets,
    setSalesTarget,
    getReportsData
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics endpoints require authentication
router.get('/dashboard', authenticate, authorize(['FINANCE_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN']), getDashboard);
router.get('/revenue', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getRevenueAnalytics);
router.get('/sales', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getSales);
router.get('/sales/employees', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getSalesByEmployees);
router.get('/sales/employees/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getSalesByEmployeeId);
router.get('/sales/funnel', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getSalesFunnel);
router.get('/sales/targets', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getSalesTargets);
router.put('/sales/targets/:quarter', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), setSalesTarget);
router.get('/reports', authenticate, authorize(['FINANCE_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN']), getReportsData);
router.get('/hr', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), getHRMetrics);
router.get('/inventory', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getInventoryMetrics);
router.get('/manufacturing', authenticate, authorize(['SUPER_ADMIN']), getManufacturingMetrics);

export default router;
