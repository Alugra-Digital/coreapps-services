import { db } from '../../../shared/db/index.js';
import {
  accounts,
  employees,
  expenseClaims,
  journalEntries,
  journalEntryLines,
} from '../../../shared/db/schema.js';
import { and, desc, eq } from 'drizzle-orm';
import { applyJournalLinesToAccountBalances } from './accountingService.js';

export const getExpenses = async ({ status, employeeId } = {}) => {
  let query = db
    .select({
      id: expenseClaims.id,
      employeeId: expenseClaims.employeeId,
      date: expenseClaims.date,
      category: expenseClaims.category,
      description: expenseClaims.description,
      amount: expenseClaims.amount,
      status: expenseClaims.status,
      debitAccountId: expenseClaims.debitAccountId,
      creditAccountId: expenseClaims.creditAccountId,
      journalEntryId: expenseClaims.journalEntryId,
      createdAt: expenseClaims.createdAt,
      updatedAt: expenseClaims.updatedAt,
      postedAt: expenseClaims.postedAt,
      employeeNik: employees.nik,
      employeeName: employees.name,
    })
    .from(expenseClaims)
    .leftJoin(employees, eq(expenseClaims.employeeId, employees.id))
    .orderBy(desc(expenseClaims.createdAt));

  const clauses = [];
  if (status) clauses.push(eq(expenseClaims.status, status));
  if (typeof employeeId === 'number') clauses.push(eq(expenseClaims.employeeId, employeeId));
  if (clauses.length) query = query.where(and(...clauses));

  return await query;
};

export const createExpense = async (data) => {
  return await db.transaction(async (tx) => {
    const [employee] = await tx.select().from(employees).where(eq(employees.id, data.employeeId));
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    const [debitAccount] = await tx.select().from(accounts).where(eq(accounts.id, data.debitAccountId));
    const [creditAccount] = await tx.select().from(accounts).where(eq(accounts.id, data.creditAccountId));
    if (!debitAccount || !creditAccount) {
      const error = new Error('Invalid accounts');
      error.statusCode = 400;
      throw error;
    }

    const [expense] = await tx
      .insert(expenseClaims)
      .values({ ...data, status: 'DRAFT', updatedAt: new Date() })
      .returning();
    return expense;
  });
};

export const changeExpenseStatus = async (id, nextStatus) => {
  return await db.transaction(async (tx) => {
    const [expense] = await tx.select().from(expenseClaims).where(eq(expenseClaims.id, id));
    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      throw error;
    }

    if (expense.status === 'POSTED') {
      const error = new Error('Cannot change status of a posted expense');
      error.statusCode = 409;
      throw error;
    }

    const allowed = new Set([
      'DRAFT',
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
    ]);
    if (!allowed.has(nextStatus)) {
      const error = new Error('Invalid status');
      error.statusCode = 400;
      throw error;
    }

    const [updated] = await tx
      .update(expenseClaims)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(expenseClaims.id, id))
      .returning();
    return updated;
  });
};

export const postExpense = async (id) => {
  return await db.transaction(async (tx) => {
    const [expense] = await tx.select().from(expenseClaims).where(eq(expenseClaims.id, id));
    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      throw error;
    }
    if (expense.status === 'POSTED') {
      const error = new Error('Expense already posted');
      error.statusCode = 409;
      throw error;
    }
    if (expense.status !== 'APPROVED') {
      const error = new Error('Expense must be APPROVED before posting');
      error.statusCode = 400;
      throw error;
    }

    const amount = Number(expense.amount || 0);
    if (!(amount > 0)) {
      const error = new Error('Amount must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    const reference = `EXP-${expense.id}`;
    const description = expense.description || `Expense claim ${expense.id}`;

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        reference,
        description,
        status: 'POSTED',
        totalDebit: String(amount),
        totalCredit: String(amount),
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const lines = [
      {
        journalEntryId: entry.id,
        accountId: expense.debitAccountId,
        debit: String(amount),
        credit: '0',
        description,
        reference,
      },
      {
        journalEntryId: entry.id,
        accountId: expense.creditAccountId,
        debit: '0',
        credit: String(amount),
        description,
        reference,
      },
    ];

    await tx.insert(journalEntryLines).values(lines);
    await applyJournalLinesToAccountBalances(tx, lines);

    const [updated] = await tx
      .update(expenseClaims)
      .set({
        status: 'POSTED',
        journalEntryId: entry.id,
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, id))
      .returning();

    return { expense: updated, journalEntry: entry };
  });
};

