import { db } from '../../../shared/db/index.js';
import {
  employees,
  salaryStructures,
  salarySlips,
  accounts,
  journalEntries,
  journalEntryLines,
  employeeLoans,
} from '../../../shared/db/schema.js';
import { and, desc, eq, sql } from 'drizzle-orm';
import { applyJournalLinesToAccountBalances } from './accountingService.js';

export const getSalaryStructures = async () => {
  const rows = await db
    .select({
      id: salaryStructures.id,
      employeeId: salaryStructures.employeeId,
      baseSalary: salaryStructures.baseSalary,
      allowances: salaryStructures.allowances,
      deductions: salaryStructures.deductions,
      salaryExpenseAccountId: salaryStructures.salaryExpenseAccountId,
      payrollPayableAccountId: salaryStructures.payrollPayableAccountId,
      updatedAt: salaryStructures.updatedAt,
      employeeNik: employees.nik,
      employeeName: employees.name,
    })
    .from(salaryStructures)
    .leftJoin(employees, eq(salaryStructures.employeeId, employees.id))
    .orderBy(desc(salaryStructures.updatedAt));

  return rows;
};

export const upsertSalaryStructure = async (employeeId, data) => {
  return await db.transaction(async (tx) => {
    const [employee] = await tx.select().from(employees).where(eq(employees.id, employeeId));
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    const [existing] = await tx
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.employeeId, employeeId));

    if (existing) {
      const [updated] = await tx
        .update(salaryStructures)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(salaryStructures.employeeId, employeeId))
        .returning();
      return updated;
    }

    const [created] = await tx
      .insert(salaryStructures)
      .values({ employeeId, ...data })
      .returning();
    return created;
  });
};

export const getSalarySlips = async ({ periodYear, periodMonth, employeeId } = {}) => {
  let query = db
    .select({
      id: salarySlips.id,
      employeeId: salarySlips.employeeId,
      periodYear: salarySlips.periodYear,
      periodMonth: salarySlips.periodMonth,
      gross: salarySlips.gross,
      totalDeductions: salarySlips.totalDeductions,
      netPay: salarySlips.netPay,
      status: salarySlips.status,
      journalEntryId: salarySlips.journalEntryId,
      createdAt: salarySlips.createdAt,
      postedAt: salarySlips.postedAt,
      employeeNik: employees.nik,
      employeeName: employees.name,
    })
    .from(salarySlips)
    .leftJoin(employees, eq(salarySlips.employeeId, employees.id))
    .orderBy(desc(salarySlips.createdAt));

  const clauses = [];
  if (typeof periodYear === 'number') clauses.push(eq(salarySlips.periodYear, periodYear));
  if (typeof periodMonth === 'number') clauses.push(eq(salarySlips.periodMonth, periodMonth));
  if (typeof employeeId === 'number') clauses.push(eq(salarySlips.employeeId, employeeId));
  if (clauses.length) query = query.where(and(...clauses));

  return await query;
};

export const createSalarySlip = async ({ employeeId, periodYear, periodMonth }) => {
  return await db.transaction(async (tx) => {
    const [employee] = await tx.select().from(employees).where(eq(employees.id, employeeId));
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    const [structure] = await tx
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.employeeId, employeeId));
    if (!structure) {
      const error = new Error('Salary structure not set for employee');
      error.statusCode = 400;
      throw error;
    }

    const [existingSlip] = await tx
      .select()
      .from(salarySlips)
      .where(
        and(
          eq(salarySlips.employeeId, employeeId),
          eq(salarySlips.periodYear, periodYear),
          eq(salarySlips.periodMonth, periodMonth)
        )
      );
    if (existingSlip) {
      const error = new Error('Salary slip already exists for this employee and period');
      error.statusCode = 409;
      throw error;
    }

    const baseSalary = Number(structure.baseSalary || 0);
    const allowances = Number(structure.allowances || 0);
    const structuralDeductions = Number(structure.deductions || 0);

    const gross = baseSalary + allowances;

    // 1. Calculate PPh 21 (Simplified Indonesian Tax)
    // Monthly PTKP (TK/0) approx 4.5jt
    let pph21 = 0;
    const taxableIncome = gross - 4500000;
    if (taxableIncome > 0) {
      pph21 = taxableIncome * 0.05; // Basic 5% rate for monthly calculation
    }

    // 2. Handle Loan Repayments
    let loanRepaymentTotal = 0;
    const activeLoans = await tx.select()
      .from(employeeLoans)
      .where(and(eq(employeeLoans.employeeId, employeeId), eq(employeeLoans.status, 'ACTIVE')));

    for (const loan of activeLoans) {
      loanRepaymentTotal += parseFloat(loan.repaymentAmount);

      // Update loan remaining amount
      const newRemaining = Math.max(0, parseFloat(loan.remainingAmount) - parseFloat(loan.repaymentAmount));
      await tx.update(employeeLoans)
        .set({
          remainingAmount: String(newRemaining),
          status: newRemaining <= 0 ? 'CLOSED' : 'ACTIVE',
          updatedAt: new Date()
        })
        .where(eq(employeeLoans.id, loan.id));
    }

    const totalDeductions = structuralDeductions + pph21 + loanRepaymentTotal;
    const netPay = gross - totalDeductions;

    const [slip] = await tx
      .insert(salarySlips)
      .values({
        employeeId,
        periodYear,
        periodMonth,
        gross: String(gross),
        pph21: String(pph21),
        loanRepayment: String(loanRepaymentTotal),
        totalDeductions: String(totalDeductions),
        netPay: String(netPay),
        status: 'DRAFT',
      })
      .returning();

    return slip;
  });
};

export const postSalarySlip = async (salarySlipId) => {
  return await db.transaction(async (tx) => {
    const [slip] = await tx.select().from(salarySlips).where(eq(salarySlips.id, salarySlipId));
    if (!slip) {
      const error = new Error('Salary slip not found');
      error.statusCode = 404;
      throw error;
    }
    if (slip.status === 'POSTED') {
      const error = new Error('Salary slip already posted');
      error.statusCode = 409;
      throw error;
    }

    const [structure] = await tx
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.employeeId, slip.employeeId));
    if (!structure?.salaryExpenseAccountId || !structure?.payrollPayableAccountId) {
      const error = new Error('Salary structure must include salary expense and payroll payable accounts');
      error.statusCode = 400;
      throw error;
    }

    const netPay = Number(slip.netPay || 0);
    if (!(netPay > 0)) {
      const error = new Error('Net pay must be greater than 0 to post');
      error.statusCode = 400;
      throw error;
    }

    const [expenseAccount] = await tx
      .select()
      .from(accounts)
      .where(eq(accounts.id, structure.salaryExpenseAccountId));
    const [payableAccount] = await tx
      .select()
      .from(accounts)
      .where(eq(accounts.id, structure.payrollPayableAccountId));
    if (!expenseAccount || !payableAccount) {
      const error = new Error('Invalid payroll accounts');
      error.statusCode = 400;
      throw error;
    }

    const reference = `PAYROLL-${slip.periodYear}-${String(slip.periodMonth).padStart(2, '0')}-EMP-${slip.employeeId}`;
    const description = `Payroll posted for employee ${slip.employeeId}`;

    const totalDebit = netPay;
    const totalCredit = netPay;

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        reference,
        description,
        status: 'POSTED',
        totalDebit: String(totalDebit),
        totalCredit: String(totalCredit),
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const lines = [
      {
        journalEntryId: entry.id,
        accountId: expenseAccount.id,
        debit: String(netPay),
        credit: '0',
        description,
        reference,
      },
      {
        journalEntryId: entry.id,
        accountId: payableAccount.id,
        debit: '0',
        credit: String(netPay),
        description,
        reference,
      },
    ];

    await tx.insert(journalEntryLines).values(lines);
    await applyJournalLinesToAccountBalances(tx, lines);

    const [updatedSlip] = await tx
      .update(salarySlips)
      .set({
        status: 'POSTED',
        journalEntryId: entry.id,
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(salarySlips.id, salarySlipId))
      .returning();

    return { slip: updatedSlip, journalEntry: entry };
  });
};

