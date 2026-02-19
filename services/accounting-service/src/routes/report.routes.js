import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
    getBalanceSheet,
    getIncomeStatement,
    getTrialBalance,
    getGeneralLedger,
    getAgedReceivables,
    getAgedPayables
} from '../controllers/reportController.js';

const router = express.Router();

// All report endpoints require authentication and finance admin role
router.get('/balance-sheet', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getBalanceSheet);
router.get('/income-statement', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getIncomeStatement);
router.get('/trial-balance', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getTrialBalance);
router.get('/general-ledger', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getGeneralLedger);
router.get('/aged-receivables', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getAgedReceivables);
router.get('/aged-payables', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getAgedPayables);

export default router;
