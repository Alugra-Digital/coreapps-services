import * as periodService from '../services/accountingPeriodService.js';
import { z } from 'zod';

const createSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

const reopenSchema = z.object({ reason: z.string().min(1, 'Reason is required') });

export const getAll = async (req, res) => {
  try {
    const periods = await periodService.getAllPeriods();
    res.json(periods);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getById = async (req, res) => {
  try {
    const period = await periodService.getPeriodById(Number(req.params.id));
    if (!period) return res.status(404).json({ message: 'Period not found', code: 'NOT_FOUND' });
    res.json(period);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const create = async (req, res) => {
  try {
    const { year, month } = createSchema.parse(req.body);
    const period = await periodService.createPeriod({ year, month });
    res.status(201).json(period);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const closePeriod = async (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const period = await periodService.closePeriod(Number(req.params.id), userId);
    res.json(period);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const reopenPeriod = async (req, res) => {
  try {
    const { reason } = reopenSchema.parse(req.body);
    const userId = req.user?.id ?? null;
    const period = await periodService.reopenPeriod(Number(req.params.id), userId, reason);
    res.json(period);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const lockPeriod = async (req, res) => {
  try {
    const period = await periodService.lockPeriod(Number(req.params.id));
    res.json(period);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const createNextMonth = async (req, res) => {
  try {
    const { year, month } = createSchema.parse(req.body);
    const period = await periodService.getOrCreateNextMonthPeriod(year, month);
    res.status(201).json(period);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

// ============================================================
// NEW ENDPOINTS FOR REQUIREMENT 2.0
// ============================================================

/**
 * Validate period before closing
 * GET /api/finance/accounting-periods/:id/validate-close
 */
export const validateClose = async (req, res) => {
  try {
    const periodId = Number(req.params.id);
    const validation = await periodService.validateClosePeriod(periodId);
    res.json(validation);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

/**
 * Create next period with carry-forward
 * POST /api/finance/accounting-periods/:id/create-next
 */
export const createNext = async (req, res) => {
  try {
    const periodId = Number(req.params.id);
    const newPeriod = await periodService.createNextPeriod(periodId);
    res.status(201).json(newPeriod);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

/**
 * Get last open period
 * GET /api/finance/accounting-periods/last-open
 */
export const getLastOpen = async (req, res) => {
  try {
    const period = await periodService.getLastOpenPeriod();
    if (!period) return res.status(404).json({ message: 'No open period found', code: 'NOT_FOUND' });
    res.json(period);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

/**
 * Generate next transaction number
 * POST /api/finance/accounting-periods/:id/generate-number
 * Body: { type: 'KK' | 'KM' | 'BK' | 'BM' | 'JM' }
 */
export const generateNumber = async (req, res) => {
  try {
    const { type } = req.body;
    const periodId = Number(req.params.id);

    if (!type || !['KK', 'KM', 'KB', 'BK', 'BM', 'JM'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type', code: 'BAD_REQUEST' });
    }

    const code = await periodService.generateNextNumber(periodId, type);
    res.json({ code });
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};
