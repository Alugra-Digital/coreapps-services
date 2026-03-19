import * as jurnalMemorialService from '../services/jurnalMemorialService.js';
import * as periodService from '../services/accountingPeriodService.js';
import { z } from 'zod';

const lineSchema = z.object({
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  lineDescription: z.string().optional().nullable(),
});

const createSchema = z.object({
  periodId: z.number().int().positive(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  lines: z.array(lineSchema).min(2, 'At least 2 lines required'),
});

const updateSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  lines: z.array(lineSchema).min(2).optional(),
});

const parseLines = (lines) =>
  (lines ?? []).map((l) => ({
    ...l,
    debit: Number(l.debit ?? 0),
    credit: Number(l.credit ?? 0),
  }));

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

    const journals = await jurnalMemorialService.getByPeriod(resolvedPeriodId);
    res.json({ periodId: resolvedPeriodId, journals });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getById = async (req, res) => {
  try {
    const journal = await jurnalMemorialService.getById(Number(req.params.id));
    if (!journal) return res.status(404).json({ message: 'Journal not found', code: 'NOT_FOUND' });
    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const create = async (req, res) => {
  try {
    const raw = {
      ...req.body,
      periodId: Number(req.body.periodId),
      lines: parseLines(req.body.lines),
    };
    const data = createSchema.parse(raw);

    const period = await periodService.getPeriodById(data.periodId);
    if (!period) return res.status(404).json({ message: 'Period not found', code: 'NOT_FOUND' });
    if (period.status !== 'OPEN') {
      return res.status(400).json({ message: 'Cannot add journals to a non-open period', code: 'PERIOD_CLOSED' });
    }

    const journal = await jurnalMemorialService.create({
      ...data,
      year: period.year,
      month: period.month,
      createdBy: req.user?.id ?? null,
    });
    res.status(201).json(journal);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const update = async (req, res) => {
  try {
    const raw = {
      ...req.body,
      ...(req.body.lines ? { lines: parseLines(req.body.lines) } : {}),
    };
    const data = updateSchema.parse(raw);
    const journal = await jurnalMemorialService.update(Number(req.params.id), data);
    res.json(journal);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const post = async (req, res) => {
  try {
    const journal = await jurnalMemorialService.post(Number(req.params.id));
    res.json(journal);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const remove = async (req, res) => {
  try {
    await jurnalMemorialService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};
