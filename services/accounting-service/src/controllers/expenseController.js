import { z } from 'zod';
import * as expenseService from '../services/expenseService.js';

const createExpenseSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().positive(),
  debitAccountId: z.number().int().positive(),
  creditAccountId: z.number().int().positive(),
});

const updateExpenseStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']),
});

export const getExpenses = async (req, res) => {
  try {
    const status = req.query.status;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    const rows = await expenseService.getExpenses({
      status,
      employeeId: Number.isFinite(employeeId) ? employeeId : undefined,
    });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createExpense = async (req, res) => {
  try {
    const data = createExpenseSchema.parse(req.body);
    const payload = {
      employeeId: data.employeeId,
      date: data.date ? new Date(data.date) : new Date(),
      category: data.category,
      description: data.description,
      amount: String(data.amount),
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
    };
    const expense = await expenseService.createExpense(payload);
    res.status(201).json(expense);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const updateExpenseStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid expense id', code: 'INVALID_ID' });
    }

    const data = updateExpenseStatusSchema.parse(req.body);
    const expense = await expenseService.changeExpenseStatus(id, data.status);
    res.json(expense);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const postExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid expense id', code: 'INVALID_ID' });
    }

    const result = await expenseService.postExpense(id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

