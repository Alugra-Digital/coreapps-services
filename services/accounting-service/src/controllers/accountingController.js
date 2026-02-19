import * as accountingService from '../services/accountingService.js';
import { z } from 'zod';

const accountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  description: z.string().optional(),
  parentAccountId: z.number().optional(),
});

const journalEntrySchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(['DRAFT', 'POSTED']).default('DRAFT'),
  lines: z.array(z.object({
    accountId: z.number(),
    debit: z.number().optional(),
    credit: z.number().optional(),
    description: z.string().optional(),
  })).min(2, "Must have at least 2 lines"),
});

const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// Accounts
export const getAccounts = async (req, res) => {
  try {
    const accounts = await accountingService.getAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createAccount = async (req, res) => {
  try {
    const data = accountSchema.parse(req.body);
    const account = await accountingService.createAccount(data);
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const data = accountSchema.partial().parse(req.body);
    const account = await accountingService.updateAccount(parseInt(req.params.id), data);
    res.json(account);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await accountingService.deleteAccount(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

// Journal Entries
export const getJournalEntries = async (req, res) => {
  try {
    const entries = await accountingService.getJournalEntries();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getJournalEntryById = async (req, res) => {
  try {
    const entry = await accountingService.getJournalEntryById(parseInt(req.params.id));
    if (!entry) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createJournalEntry = async (req, res) => {
  try {
    const data = journalEntrySchema.parse(req.body);
    const entry = await accountingService.createJournalEntry(data);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const postJournalEntry = async (req, res) => {
    try {
        const entry = await accountingService.postJournalEntry(parseInt(req.params.id));
        res.json(entry);
    } catch (error) {
        res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
    }
}

export const getTrialBalanceReport = async (req, res) => {
  try {
    const { from, to } = dateRangeSchema.parse(req.query);
    const result = await accountingService.getTrialBalance({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const getGeneralLedgerReport = async (req, res) => {
  try {
    const accountId = Number(req.query.accountId);
    if (!Number.isFinite(accountId)) {
      return res.status(400).json({ message: 'accountId is required', code: 'VALIDATION_ERROR' });
    }

    const { from, to } = dateRangeSchema.parse(req.query);
    const rows = await accountingService.getGeneralLedger({
      accountId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    res.json(rows);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const getProfitAndLossReport = async (req, res) => {
  try {
    const { from, to } = dateRangeSchema.parse(req.query);
    const result = await accountingService.getProfitAndLoss({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};
