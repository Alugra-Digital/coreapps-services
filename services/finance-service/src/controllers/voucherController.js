import * as voucherService from '../services/voucherService.js';
import * as periodService from '../services/accountingPeriodService.js';
import { z } from 'zod';

const VOUCHER_TYPES = ['KAS_KECIL', 'KAS_BANK'];

const lineSchema = z.object({
  accountNumber: z.string().min(1, 'No. akun wajib diisi'),
  accountName: z.string().min(1, 'Nama akun wajib diisi'),
  description: z.string().optional().nullable(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
});

const createSchema = z.object({
  periodId: z.coerce.number().int().positive(),
  voucherType: z.enum(VOUCHER_TYPES),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  payee: z.string().min(1, 'Penerima wajib diisi'),
  description: z.string().min(1, 'Keterangan wajib diisi'),
  paymentMethod: z.string().optional().nullable(),
  receivedBy: z.string().optional().nullable(),
  attachmentUrl: z.string().url('URL tidak valid').optional().nullable(),
  lines: z.array(lineSchema).min(1, 'Minimal 1 baris wajib diisi'),
});

const updateSchema = createSchema.omit({ periodId: true, voucherType: true }).partial();

const rejectSchema = z.object({ reason: z.string().min(1, 'Alasan penolakan wajib diisi') });

const parseLines = (lines) =>
  (lines ?? []).map((l) => ({
    ...l,
    debit: Number(l.debit ?? 0),
    credit: Number(l.credit ?? 0),
  }));

export const getList = async (req, res) => {
  try {
    const { periodId, month, year, type } = req.query;

    let resolvedPeriodId = periodId ? Number(periodId) : null;

    if (!resolvedPeriodId && month && year) {
      const period = await periodService.getPeriodByYearMonth(Number(year), Number(month));
      resolvedPeriodId = period?.id ?? null;
    }

    if (!resolvedPeriodId) {
      return res.status(400).json({ message: 'periodId or month+year query param required', code: 'VALIDATION_ERROR' });
    }

    const voucherType = VOUCHER_TYPES.includes(type) ? type : undefined;
    const voucherList = await voucherService.getByPeriod(resolvedPeriodId, voucherType);
    res.json({ periodId: resolvedPeriodId, vouchers: voucherList });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getById = async (req, res) => {
  try {
    const voucher = await voucherService.getById(Number(req.params.id));
    if (!voucher) return res.status(404).json({ message: 'Voucher not found', code: 'NOT_FOUND' });
    res.json(voucher);
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
      return res.status(400).json({ message: 'Cannot create vouchers in a non-open period', code: 'PERIOD_CLOSED' });
    }

    const voucher = await voucherService.create({
      ...data,
      year: period.year,
      month: period.month,
      createdBy: req.user?.id ?? null,
    });
    res.status(201).json(voucher);
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
    const voucher = await voucherService.update(Number(req.params.id), data);
    res.json(voucher);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const submit = async (req, res) => {
  try {
    const voucher = await voucherService.submit(Number(req.params.id));
    res.json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const review = async (req, res) => {
  try {
    const voucher = await voucherService.review(Number(req.params.id), req.user?.id ?? null);
    res.json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const approve = async (req, res) => {
  try {
    const voucher = await voucherService.approve(Number(req.params.id), req.user?.id ?? null);
    res.json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const pay = async (req, res) => {
  try {
    const voucher = await voucherService.markPaid(Number(req.params.id), req.user?.id ?? null);
    res.json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const reject = async (req, res) => {
  try {
    const { reason } = rejectSchema.parse(req.body);
    const voucher = await voucherService.reject(Number(req.params.id), req.user?.id ?? null, reason);
    res.json(voucher);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const cancel = async (req, res) => {
  try {
    const voucher = await voucherService.cancel(Number(req.params.id));
    res.json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const remove = async (req, res) => {
  try {
    await voucherService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

// Auto-generation endpoints
export const generateFromKasKecil = async (req, res) => {
  try {
    const { kasKecilId } = req.body;
    if (!kasKecilId) {
      return res.status(400).json({ message: 'kasKecilId is required', code: 'VALIDATION_ERROR' });
    }

    const voucher = await voucherService.autoGenerateVoucherFromKasKecil(
      Number(kasKecilId),
      req.user?.id ?? null
    );
    res.status(201).json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};

export const generateFromKasBank = async (req, res) => {
  try {
    const { kasBankId } = req.body;
    if (!kasBankId) {
      return res.status(400).json({ message: 'kasBankId is required', code: 'VALIDATION_ERROR' });
    }

    const voucher = await voucherService.autoGenerateVoucherFromKasBank(
      Number(kasBankId),
      req.user?.id ?? null
    );
    res.status(201).json(voucher);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
  }
};
