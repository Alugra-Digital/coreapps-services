import * as service from '../services/assetDepreciationJournalService.js';
import { z } from 'zod';

const generateSchema = z.object({
  periodId: z.coerce.number().int().positive(),
});

export const getList = async (req, res) => {
  try {
    const { periodId } = req.query;
    if (!periodId) {
      return res.status(400).json({ message: 'periodId query param required', code: 'VALIDATION_ERROR' });
    }
    const records = await service.getByPeriod(Number(periodId));
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const generate = async (req, res) => {
  try {
    const { periodId } = generateSchema.parse(req.body);
    const result = await service.generateForPeriod(periodId);
    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

/**
 * Generate depreciation records AND immediately post them as journal entries
 * Auto-generates Jurnal Penyusutan from Daftar Depresiasi Aset
 */
export const generateAndPost = async (req, res) => {
  try {
    const { periodId } = generateSchema.parse(req.body);
    const result = await service.generateAndPostForPeriod(periodId);
    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const postAll = async (req, res) => {
  try {
    const { periodId } = generateSchema.parse(req.body);
    const result = await service.postAll(periodId);
    res.json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const remove = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};
