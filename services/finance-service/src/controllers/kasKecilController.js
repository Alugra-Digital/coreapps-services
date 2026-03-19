import * as kasKecilService from '../services/kasKecilService.js';
import * as periodService from '../services/accountingPeriodService.js';
import * as voucherService from '../services/voucherService.js';
import * as assetAcquisitionJournalService from '../services/assetAcquisitionJournalService.js';
import { z } from 'zod';

const createSchema = z.object({
  periodId: z.number().int().positive(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  attachmentUrl: z.string().url().optional().nullable(),
  accountNumber: z.string().min(1, 'Account number is required').optional(),
  accountName: z.string().min(1, 'Account name is required').optional(),
  saldoFromPeriodId: z.number().int().positive().optional(),
  voucherCode: z.string().optional(),
});

const updateSchema = createSchema.omit({ periodId: true }).partial();

export const getList = async (req, res) => {
  try {
    const { periodId, month, year } = req.query;

    let resolvedPeriodId = periodId ? Number(periodId) : null;

    if (!resolvedPeriodId && month && year) {
      const period = await periodService.getPeriodByYearMonth(Number(year), Number(month));
      resolvedPeriodId = period?.id ?? null;
    }

    if (!resolvedPeriodId) {
      return res.status(400).json({ message: 'periodId or month+year query param required', code: 'VALIDATION_ERROR' });
    }

    const [transactions, summary] = await Promise.all([
      kasKecilService.getByPeriod(resolvedPeriodId),
      kasKecilService.getSummary(resolvedPeriodId),
    ]);

    res.json({ periodId: resolvedPeriodId, summary, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getById = async (req, res) => {
  try {
    const row = await kasKecilService.getById(Number(req.params.id));
    if (!row) return res.status(404).json({ message: 'Transaction not found', code: 'NOT_FOUND' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const create = async (req, res) => {
  try {
    const data = createSchema.parse({
      ...req.body,
      periodId: Number(req.body.periodId),
      debit: Number(req.body.debit ?? 0),
      credit: Number(req.body.credit ?? 0),
    });

    const period = await periodService.getPeriodById(data.periodId);
    if (!period) return res.status(404).json({ message: 'Period not found', code: 'NOT_FOUND' });
    if (period.status !== 'OPEN') {
      return res.status(400).json({ message: 'Cannot add transactions to a non-open period', code: 'PERIOD_CLOSED' });
    }

    const row = await kasKecilService.create({
      ...data,
      year: period.year,
      month: period.month,
      createdBy: req.user?.id ?? null,
      voucherCode: data.voucherCode || null,
    });

    // Auto-generate voucher
    try {
      await voucherService.autoGenerateVoucherFromKasKecil(row.id, req.user?.id ?? null);
    } catch (voucherError) {
      console.error('Auto-voucher generation failed:', voucherError.message);
      // Don't fail transaction - log and continue
    }

    // Auto-generate asset journal for asset purchases (keyword-based detection)
    // Kas Kecil has simple structure (debit/credit only), no asset account field
    const description = req.body.description?.toLowerCase() || '';
    const isAssetPurchase = description.includes('aset') || description.includes('asset');

    if (isAssetPurchase && (row.debit > 0 || row.credit > 0)) {
      try {
        // Create a simple asset journal entry for Kas Kecil
        // This will be a 2-part journal (debit asset, credit kas kecil)
        const amount = Number(row.debit > 0 ? row.debit : row.credit);
        const assetJournal = {
          periodId: row.periodId,
          assetId: req.body.assetId || null, // Would need to be passed from frontend
          date: row.date,
          description: `Asset purchase - ${row.description}`,
          debitAccount: '1240300', // Asset account
          debitAccountName: 'Aset Tetap',
          creditAccount: '1110101', // Kas Kecil account
          creditAccountName: 'Kas Kecil',
          amount: amount,
          notes: 'Auto-generated from Kas Kecil transaction',
          createdBy: req.user?.id ?? null
        };

        await assetAcquisitionJournalService.create(assetJournal);
        console.log(`Generated asset journal for Kas Kecil transaction ${row.id}`);
      } catch (assetJournalError) {
        console.error('Auto-asset journal generation failed:', assetJournalError.message);
        // Don't fail transaction - log and continue
      }
    }

    res.status(201).json(row);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const update = async (req, res) => {
  try {
    const data = updateSchema.parse({
      ...req.body,
      ...(req.body.debit !== undefined ? { debit: Number(req.body.debit) } : {}),
      ...(req.body.credit !== undefined ? { credit: Number(req.body.credit) } : {}),
    });
    const row = await kasKecilService.update(Number(req.params.id), data);
    res.json(row);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const remove = async (req, res) => {
  try {
    await kasKecilService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

// Physical Cash Reconciliation
export const getReconciliation = async (req, res) => {
  try {
    const { kasKecilTransactionId } = req.query;
    const reconciliation = await kasKecilService.getReconciliation(kasKecilTransactionId);
    res.json(reconciliation);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const reconcileCash = async (req, res) => {
  try {
    const data = req.body;
    const reconciliation = await kasKecilService.reconcileCash(data);
    res.status(201).json(reconciliation);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};
