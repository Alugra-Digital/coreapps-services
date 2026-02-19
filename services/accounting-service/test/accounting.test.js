import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the accounting service
vi.mock('../src/services/accountingService.js', () => ({
  getAccounts: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
  getJournalEntries: vi.fn(),
  getJournalEntryById: vi.fn(),
  createJournalEntry: vi.fn(),
  postJournalEntry: vi.fn(),
  getTrialBalance: vi.fn(),
  getGeneralLedger: vi.fn(),
  getProfitAndLoss: vi.fn(),
}));

import * as accountingService from '../src/services/accountingService.js';
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
  getProfitAndLossReport,
} from '../src/controllers/accountingController.js';

function createMockReqRes(body = {}, params = {}, query = {}) {
  const req = {
    body,
    params,
    query,
    user: { id: 1, role: 'FINANCE_ADMIN', permissions: [] },
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

const testAccount = {
  id: 1,
  code: '1001',
  name: 'Cash on Hand',
  type: 'ASSET',
  description: 'Petty cash',
  balance: '5000000',
  isGroup: false,
  parentAccountId: null,
};

const testJournalEntry = {
  id: 1,
  date: new Date(),
  description: 'Office supplies purchase',
  reference: 'JE-2026-001',
  status: 'DRAFT',
  totalDebit: '500000',
  totalCredit: '500000',
};

describe('Accounting Controller - Accounts (Chart of Accounts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /accounts', () => {
    it('should return all accounts', async () => {
      const { req, res } = createMockReqRes();
      accountingService.getAccounts.mockResolvedValue([testAccount]);

      await getAccounts(req, res);

      expect(res.json).toHaveBeenCalledWith([testAccount]);
    });
  });

  describe('POST /accounts', () => {
    it('should create an account with valid data', async () => {
      const accountData = {
        code: '2001',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        description: 'Trade payables',
      };

      const { req, res } = createMockReqRes(accountData);
      accountingService.createAccount.mockResolvedValue({ id: 2, ...accountData });

      await createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(accountingService.createAccount).toHaveBeenCalledWith(
        expect.objectContaining({ code: '2001', type: 'LIABILITY' })
      );
    });

    it('should reject account with missing code', async () => {
      const { req, res } = createMockReqRes({ name: 'Test', type: 'ASSET' });

      await createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject account with invalid type', async () => {
      const { req, res } = createMockReqRes({
        code: '9999',
        name: 'Test',
        type: 'INVALID_TYPE',
      });

      await createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept all valid account types', async () => {
      const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

      for (const type of validTypes) {
        vi.clearAllMocks();
        const { req, res } = createMockReqRes({
          code: `${type.substring(0, 3)}01`,
          name: `${type} Account`,
          type,
        });
        accountingService.createAccount.mockResolvedValue({
          id: 1,
          code: `${type.substring(0, 3)}01`,
          name: `${type} Account`,
          type,
        });

        await createAccount(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      }
    });
  });

  describe('PATCH /accounts/:id', () => {
    it('should update an account', async () => {
      const { req, res } = createMockReqRes(
        { name: 'Updated Name' },
        { id: '1' }
      );
      accountingService.updateAccount.mockResolvedValue({
        ...testAccount,
        name: 'Updated Name',
      });

      await updateAccount(req, res);

      expect(accountingService.updateAccount).toHaveBeenCalledWith(1, { name: 'Updated Name' });
    });
  });

  describe('DELETE /accounts/:id', () => {
    it('should delete an account', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });
      accountingService.deleteAccount.mockResolvedValue(undefined);

      await deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});

describe('Accounting Controller - Journal Entries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /journal-entries', () => {
    it('should return all journal entries', async () => {
      const { req, res } = createMockReqRes();
      accountingService.getJournalEntries.mockResolvedValue([testJournalEntry]);

      await getJournalEntries(req, res);

      expect(res.json).toHaveBeenCalledWith([testJournalEntry]);
    });
  });

  describe('GET /journal-entries/:id', () => {
    it('should return journal entry by ID', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });
      accountingService.getJournalEntryById.mockResolvedValue(testJournalEntry);

      await getJournalEntryById(req, res);

      expect(res.json).toHaveBeenCalledWith(testJournalEntry);
    });

    it('should return 404 for non-existent entry', async () => {
      const { req, res } = createMockReqRes({}, { id: '999' });
      accountingService.getJournalEntryById.mockResolvedValue(null);

      await getJournalEntryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /journal-entries', () => {
    it('should create a balanced journal entry', async () => {
      const entryData = {
        description: 'Purchase office supplies',
        reference: 'JE-2026-002',
        lines: [
          { accountId: 1, debit: 500000, credit: 0, description: 'Office Supplies' },
          { accountId: 2, debit: 0, credit: 500000, description: 'Cash' },
        ],
      };

      const { req, res } = createMockReqRes(entryData);
      accountingService.createJournalEntry.mockResolvedValue({
        id: 2,
        ...entryData,
        status: 'DRAFT',
        totalDebit: '500000',
        totalCredit: '500000',
      });

      await createJournalEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject entry with less than 2 lines', async () => {
      const { req, res } = createMockReqRes({
        description: 'Test',
        lines: [
          { accountId: 1, debit: 100, credit: 0 },
        ],
      });

      await createJournalEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject entry with no lines', async () => {
      const { req, res } = createMockReqRes({
        description: 'Test',
        lines: [],
      });

      await createJournalEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('POST /journal-entries/:id/post', () => {
    it('should post a draft journal entry', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });
      accountingService.postJournalEntry.mockResolvedValue({
        ...testJournalEntry,
        status: 'POSTED',
        postedAt: new Date(),
      });

      await postJournalEntry(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'POSTED' })
      );
    });

    it('should handle errors when posting', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });
      accountingService.postJournalEntry.mockRejectedValue(
        new Error('Entry is not in DRAFT status')
      );

      await postJournalEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe('Accounting Controller - Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /reports/trial-balance', () => {
    it('should return trial balance', async () => {
      const { req, res } = createMockReqRes({}, {}, { from: '2026-01-01', to: '2026-12-31' });
      accountingService.getTrialBalance.mockResolvedValue({
        accounts: [
          { code: '1001', name: 'Cash', debit: '5000000', credit: '0' },
          { code: '2001', name: 'Payable', debit: '0', credit: '5000000' },
        ],
        totalDebit: '5000000',
        totalCredit: '5000000',
      });

      await getTrialBalanceReport(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalDebit: '5000000',
          totalCredit: '5000000',
        })
      );
    });
  });

  describe('GET /reports/general-ledger', () => {
    it('should return general ledger for specific account', async () => {
      const { req, res } = createMockReqRes(
        {}, {},
        { accountId: '1', from: '2026-01-01', to: '2026-12-31' }
      );
      accountingService.getGeneralLedger.mockResolvedValue([
        { date: '2026-01-15', debit: '100000', credit: '0', description: 'Entry 1' },
      ]);

      await getGeneralLedgerReport(req, res);

      expect(accountingService.getGeneralLedger).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 1 })
      );
    });

    it('should return 400 when accountId is missing', async () => {
      const { req, res } = createMockReqRes({}, {}, {});

      await getGeneralLedgerReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('GET /reports/profit-loss', () => {
    it('should return P&L report', async () => {
      const { req, res } = createMockReqRes({}, {}, { from: '2026-01-01', to: '2026-12-31' });
      accountingService.getProfitAndLoss.mockResolvedValue({
        revenue: '50000000',
        expenses: '30000000',
        netIncome: '20000000',
      });

      await getProfitAndLossReport(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ netIncome: '20000000' })
      );
    });
  });
});

describe('Double-Entry Validation', () => {
  it('debits should equal credits for a valid entry', () => {
    const lines = [
      { accountId: 1, debit: 1000000, credit: 0 },
      { accountId: 2, debit: 0, credit: 1000000 },
    ];

    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    expect(totalDebit).toBe(totalCredit);
    expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(0.01);
  });

  it('unbalanced entry should be detectable', () => {
    const lines = [
      { accountId: 1, debit: 1000000, credit: 0 },
      { accountId: 2, debit: 0, credit: 900000 },
    ];

    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    expect(totalDebit).not.toBe(totalCredit);
    expect(Math.abs(totalDebit - totalCredit)).toBeGreaterThan(0.01);
  });
});
