import * as kasBankService from '../services/kasBankService.js';
import * as periodService from '../services/accountingPeriodService.js';
import * as voucherService from '../services/voucherService.js';
import * as assetAcquisitionJournalService from '../services/assetAcquisitionJournalService.js';
import { z } from 'zod';
import { db } from '../../../shared/db/index.js';
import { assets, accountingPeriods } from '../../../shared/db/schema.js';
import { eq, sql } from 'drizzle-orm';

const lineSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().optional(),
});

const createSchema = z.object({
  periodId: z.number().int().positive(),
  date: z.string().min(1, 'Date is required'),
  coaAccount: z.string().min(1, 'COA account is required'),
  description: z.string().min(1, 'Description is required'),
  inflow: z.number().min(0).default(0),
  outflow: z.number().min(0).default(0),
  reference: z.string().optional().nullable(),
  lines: z.array(lineSchema).optional().default([]),
  voucherCode: z.string().optional().nullable(),
});

const updateSchema = createSchema.omit({ periodId: true }).partial();

export const getList = async (req, res) => {
  try {
    const { periodId, month, year, coaAccount } = req.query;

    let resolvedPeriodId = periodId ? Number(periodId) : null;

    if (!resolvedPeriodId && month && year) {
      const period = await periodService.getPeriodByYearMonth(Number(year), Number(month));
      resolvedPeriodId = period?.id ?? null;
    }

    if (!resolvedPeriodId) {
      return res.status(400).json({ message: 'periodId or month+year query param required', code: 'VALIDATION_ERROR' });
    }

    const [transactions, summary] = await Promise.all([
      kasBankService.getByPeriod(resolvedPeriodId, coaAccount ?? null),
      kasBankService.getSummary(resolvedPeriodId),
    ]);

    res.json({ periodId: resolvedPeriodId, summary, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getById = async (req, res) => {
  try {
    const row = await kasBankService.getByIdWithLines(Number(req.params.id));
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
      inflow: Number(req.body.inflow ?? 0),
      outflow: Number(req.body.outflow ?? 0),
    });

    const period = await periodService.getPeriodById(data.periodId);
    if (!period) return res.status(404).json({ message: 'Period not found', code: 'NOT_FOUND' });
    if (period.status !== 'OPEN') {
      return res.status(400).json({ message: 'Cannot add transactions to a non-open period', code: 'PERIOD_CLOSED' });
    }

    // Validate that inflow or outflow is provided
    if (data.inflow === 0 && data.outflow === 0) {
      return res.status(400).json({ message: 'Inflow or outflow must be greater than 0', code: 'VALIDATION_ERROR' });
    }

    // Validate multi-line entries
    if (data.lines && data.lines.length > 0) {
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

      // For compound entries, debits should equal the amount being debited from bank
      if (data.inflow > 0 && totalDebit !== data.inflow) {
        return res.status(400).json({
          message: 'Total debit from lines must equal inflow amount',
          code: 'VALIDATION_ERROR',
        });
      }
      if (data.outflow > 0 && totalCredit !== data.outflow) {
        return res.status(400).json({
          message: 'Total credit from lines must equal outflow amount',
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const row = await kasBankService.create({
      ...data,
      year: period.year,
      month: period.month,
      createdBy: req.user?.id ?? null,
      voucherCode: data.voucherCode || null,
    });

    // Auto-generate voucher
    try {
      await voucherService.autoGenerateVoucherFromKasBank(row.id, req.user?.id ?? null);
    } catch (voucherError) {
      console.error('Auto-voucher generation failed:', voucherError.message);
      // Don't fail transaction - log and continue
    }

    // Auto-generate 3-part asset journal for asset purchases
    // The existing generate3PartAssetJournal already checks if transaction uses asset accounts
    try {
      const assetJournal = await assetAcquisitionJournalService.generate3PartAssetJournal(
        row.id,
        row.periodId,
        req.user?.id ?? null
      );
      if (assetJournal) {
        console.log(`Generated 3-part asset journal for transaction ${row.id}`);
      }
    } catch (assetJournalError) {
      console.error('Auto-asset journal generation failed:', assetJournalError.message);
      // Don't fail transaction - log and continue
    }

    // Auto-create asset master for account 1240300 purchases
    if (row.coaAccount === '1240300' && Number(row.outflow) > 0) {
      try {
        const [assetPeriod] = await db.select().from(accountingPeriods).where(eq(accountingPeriods.id, row.periodId));
        const mm = String(assetPeriod.month).padStart(2, '0');
        const yy = String(assetPeriod.year).slice(-2);

        // Generate asset code: ALG-AP{MM}{YY}{NNN}
        const prefix = `ALG-AP${mm}${yy}`;
        const existingAssets = await db.select({ assetCode: assets.assetCode })
          .from(assets)
          .where(sql`${assets.assetCode} LIKE ${prefix + '%'}`);
        const seq = existingAssets.length > 0
          ? Math.max(...existingAssets.map(a => parseInt(a.assetCode?.slice(-3) ?? '0', 10))) + 1
          : 1;
        const assetCode = `${prefix}${String(seq).padStart(3, '0')}`;

        const purchaseAmount = Number(row.outflow);

        await db.insert(assets).values({
          assetCode,
          name: row.description,
          category: 'ELECTRONICS',
          purchaseDate: new Date(row.date),
          purchaseAmount: String(purchaseAmount),
          salvageValue: '0',
          usefulLifeMonths: 48,
          status: 'ACTIVE',
          coaAssetAccount: '1240300',
          coaDepreciationExpenseAccount: '6211202',
          coaAccumulatedDepreciationAccount: '1240903',
          valueAfterDepreciation: String(purchaseAmount),
          totalDepreciation: '0',
        });

        console.log(`Auto-created asset master ${assetCode} for Kas Bank transaction ${row.id}`);
      } catch (assetCreateError) {
        console.error('Auto-asset master creation failed:', assetCreateError.message);
        // Non-fatal — log and continue
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
      ...(req.body.inflow !== undefined ? { inflow: Number(req.body.inflow) } : {}),
      ...(req.body.outflow !== undefined ? { outflow: Number(req.body.outflow) } : {}),
    });

    // Validate multi-line entries if provided
    if (data.lines && data.lines.length > 0) {
      const existing = await kasBankService.getById(Number(req.params.id));
      const inflow = data.inflow !== undefined ? data.inflow : Number(existing?.inflow ?? 0);
      const outflow = data.outflow !== undefined ? data.outflow : Number(existing?.outflow ?? 0);

      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

      if (inflow > 0 && totalDebit !== inflow) {
        return res.status(400).json({
          message: 'Total debit from lines must equal inflow amount',
          code: 'VALIDATION_ERROR',
        });
      }
      if (outflow > 0 && totalCredit !== outflow) {
        return res.status(400).json({
          message: 'Total credit from lines must equal outflow amount',
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const row = await kasBankService.update(Number(req.params.id), data);
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
    await kasBankService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};
