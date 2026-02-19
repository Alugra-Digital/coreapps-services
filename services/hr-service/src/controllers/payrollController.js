import { z } from 'zod';
import * as payrollService from '../services/payrollService.js';

const upsertSalaryStructureSchema = z.object({
  baseSalary: z.number().min(0).optional(),
  allowances: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
  salaryExpenseAccountId: z.number().int().positive().optional(),
  payrollPayableAccountId: z.number().int().positive().optional(),
});

const createSalarySlipSchema = z.object({
  employeeId: z.number().int().positive(),
  periodYear: z.number().int().min(2000).max(2100),
  periodMonth: z.number().int().min(1).max(12),
});

export const getSalaryStructures = async (req, res) => {
  try {
    const rows = await payrollService.getSalaryStructures();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const upsertSalaryStructure = async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!Number.isFinite(employeeId)) {
      return res.status(400).json({ message: 'Invalid employee id', code: 'INVALID_ID' });
    }

    const data = upsertSalaryStructureSchema.parse(req.body);
    const payload = {
      ...data,
      baseSalary: data.baseSalary != null ? String(data.baseSalary) : undefined,
      allowances: data.allowances != null ? String(data.allowances) : undefined,
      deductions: data.deductions != null ? String(data.deductions) : undefined,
    };

    const structure = await payrollService.upsertSalaryStructure(employeeId, payload);
    res.json(structure);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const getSalarySlips = async (req, res) => {
  try {
    const periodYear = req.query.year ? Number(req.query.year) : undefined;
    const periodMonth = req.query.month ? Number(req.query.month) : undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    const rows = await payrollService.getSalarySlips({
      periodYear: Number.isFinite(periodYear) ? periodYear : undefined,
      periodMonth: Number.isFinite(periodMonth) ? periodMonth : undefined,
      employeeId: Number.isFinite(employeeId) ? employeeId : undefined,
    });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createSalarySlip = async (req, res) => {
  try {
    const data = createSalarySlipSchema.parse(req.body);
    const slip = await payrollService.createSalarySlip(data);
    res.status(201).json(slip);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const postSalarySlip = async (req, res) => {
  try {
    const salarySlipId = Number(req.params.id);
    if (!Number.isFinite(salarySlipId)) {
      return res.status(400).json({ message: 'Invalid salary slip id', code: 'INVALID_ID' });
    }

    const result = await payrollService.postSalarySlip(salarySlipId);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

