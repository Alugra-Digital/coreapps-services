import * as service from '../services/assetAcquisitionJournalService.js';
import { z } from 'zod';
import * as periodService from '../services/accountingPeriodService.js';

const createSchema = z.object({
  periodId: z.coerce.number().int().positive(),
  assetId: z.coerce.number().int().positive(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().min(1, 'Keterangan wajib diisi'),
  debitAccount: z.string().min(1, 'Akun debit wajib diisi'),
  debitAccountName: z.string().min(1, 'Nama akun debit wajib diisi'),
  creditAccount: z.string().min(1, 'Akun kredit wajib diisi'),
  creditAccountName: z.string().min(1, 'Nama akun kredit wajib diisi'),
  amount: z.coerce.number().positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional().nullable(),
});

const updateSchema = createSchema.omit({ periodId: true, assetId: true }).partial();

export const getList = async (req, res) => {
  try {
    const { periodId } = req.query;
    if (!periodId) {
      return res.status(400).json({ message: 'periodId query param required', code: 'VALIDATION_ERROR' });
    }
    const journals = await service.getByPeriod(Number(periodId));
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getById = async (req, res) => {
  try {
    const journal = await service.getById(Number(req.params.id));
    if (!journal) return res.status(404).json({ message: 'Journal not found', code: 'NOT_FOUND' });
    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const create = async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const journal = await service.create({ ...data, createdBy: req.user?.id ?? null });
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
    const data = updateSchema.parse(req.body);
    const journal = await service.update(Number(req.params.id), data);
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
    const journal = await service.post(Number(req.params.id));
    res.json(journal);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

// Auto-generation endpoint
export const generateFromKasBank = async (req, res) => {
  try {
    const { kasBankId, periodId } = req.body;
    if (!kasBankId) {
      return res.status(400).json({ message: 'kasBankId is required', code: 'VALIDATION_ERROR' });
    }
    if (!periodId) {
      return res.status(400).json({ message: 'periodId is required', code: 'VALIDATION_ERROR' });
    }

    const journal = await service.generate3PartAssetJournal(
      Number(kasBankId),
      Number(periodId),
      req.user?.id ?? null
    );

    if (journal) {
      res.status(201).json(journal);
    } else {
      res.status(200).json({ message: 'Not a 3-part asset journal transaction' });
    }
  } catch (error) {
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
