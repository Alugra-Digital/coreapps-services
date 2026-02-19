import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  postJournalEntry,
  getTrialBalanceReport,
  getGeneralLedgerReport,
  getProfitAndLossReport
} from '../controllers/accountingController.js';
import {
  getBalanceSheet,
  getIncomeStatement,
  getTrialBalance,
  getGeneralLedger,
  getAgedReceivables,
  getAgedPayables
} from '../controllers/reportController.js';

const router = express.Router();

// Accounts
router.get('/accounts', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getAccounts);
router.post('/accounts', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createAccount);
router.patch('/accounts/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateAccount);
router.delete('/accounts/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteAccount);

// Journal Entries
router.get('/journal-entries', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getJournalEntries);
router.get('/journal-entries/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getJournalEntryById);
router.post('/journal-entries', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createJournalEntry);
router.post('/journal-entries/:id/post', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), postJournalEntry);

// Reports - Old endpoints (from accountingController)
router.get('/reports/trial-balance', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getTrialBalanceReport);
router.get('/reports/general-ledger', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getGeneralLedgerReport);
router.get('/reports/profit-loss', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getProfitAndLossReport);

// Reports - New endpoints (from reportController)
router.get('/reports/balance-sheet', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getBalanceSheet);
router.get('/reports/income-statement', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getIncomeStatement);
router.get('/reports/aged-receivables', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getAgedReceivables);
router.get('/reports/aged-payables', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getAgedPayables);

export default router;
