import { db } from '../../../shared/db/index.js';
import { vouchers, voucherLines, accountingPeriods, kasKecilTransactions, kasBankTransactions, kasBankTransactionLines } from '../../../shared/db/schema.js';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';
import * as bukuBesarService from './bukuBesarService.js';

const FINAL_STATUSES = ['PAID', 'REJECTED', 'CANCELLED'];
const activeRows = () => isNull(vouchers.deletedAt);

// ── Auto-generation from transactions ──────────────────────────────────────────────

export const autoGenerateVoucherFromKasKecil = async (kasKecilId, userId) => {
  // Check if voucher already exists for this transaction
  const [existing] = await db.select()
    .from(vouchers)
    .where(and(
      eq(vouchers.sourceType, 'KAS_KECIL'),
      eq(vouchers.sourceId, kasKecilId),
      activeRows()
    ));

  if (existing) {
    throw new Error('Voucher already exists for this Kas Kecil transaction');
  }

  // Get the transaction
  const [transaction] = await db.select()
    .from(kasKecilTransactions)
    .where(eq(kasKecilTransactions.id, kasKecilId));

  if (!transaction) {
    throw new Error('Kas Kecil transaction not found');
  }

  const period = await db.select()
    .from(accountingPeriods)
    .where(eq(accountingPeriods.id, transaction.periodId))
    .then(rows => rows[0]);

  if (!period) {
    throw new Error('Period not found');
  }

  const debit = Number(transaction.debit || 0);
  const credit = Number(transaction.credit || 0);
  const amount = Math.max(debit, credit);

  if (amount === 0) {
    throw new Error('Transaction has no debit or credit amount');
  }

  const kasKecilAccount = '1110101'; // Kas Kecil
  const counterpartAccount = transaction.coaAccount || '5110100'; // Default to general expense

  // Build double-entry voucher lines
  // credit > 0: cash going OUT (expense) → debit expense, credit kas kecil
  // debit > 0:  cash coming IN  (income) → debit kas kecil, credit income account
  const lines = credit > 0
    ? [
        { accountNumber: counterpartAccount, accountName: null, description: transaction.description, debit: credit, credit: 0 },
        { accountNumber: kasKecilAccount, accountName: 'Kas Kecil', description: transaction.description, debit: 0, credit: credit },
      ]
    : [
        { accountNumber: kasKecilAccount, accountName: 'Kas Kecil', description: transaction.description, debit: debit, credit: 0 },
        { accountNumber: counterpartAccount, accountName: null, description: transaction.description, debit: 0, credit: debit },
      ];

  // Generate voucher number
  const voucherNumber = await generateVoucherNumber(period.year, period.month, 'KAS_KECIL');

  const workflowLog = JSON.stringify([{
    from: null,
    to: 'APPROVED',
    action: 'AUTO_GENERATED',
    userId,
    timestamp: new Date().toISOString(),
    description: `Auto-generated from Kas Kecil transaction ${transaction.transNumber || transaction.transactionCode}`,
  }]);

  const [voucher] = await db.insert(vouchers).values({
    periodId: transaction.periodId,
    voucherNumber,
    voucherType: 'KAS_KECIL',
    date: transaction.date,
    payee: 'Kas Kecil',
    description: transaction.description,
    totalAmount: String(amount),
    paymentMethod: null,
    status: 'APPROVED',
    sourceType: 'KAS_KECIL',
    sourceId: kasKecilId,
    workflowLog,
    attachmentUrl: transaction.attachmentUrl || null,
    createdBy: userId ?? null,
    preparedBy: userId ?? null,
    approvedBy: userId ?? null,
    approvedAt: new Date(),
  }).returning();

  // Create voucher lines
  await db.insert(voucherLines).values(
    lines.map((l) => ({
      voucherId: voucher.id,
      accountNumber: l.accountNumber,
      accountName: l.accountName || l.accountNumber,
      description: l.description ?? null,
      debit: String(l.debit ?? 0),
      credit: String(l.credit ?? 0),
    }))
  );

  // Auto-post to Buku Besar immediately
  try {
    await bukuBesarService.postFromVoucher(voucher);
  } catch (postError) {
    console.error('Auto-posting Kas Kecil voucher to Buku Besar failed:', postError.message);
  }

  return getById(voucher.id);
};

export const autoGenerateVoucherFromKasBank = async (kasBankId, userId) => {
  // Check if voucher already exists for this transaction
  const [existing] = await db.select()
    .from(vouchers)
    .where(and(
      eq(vouchers.sourceType, 'KAS_BANK'),
      eq(vouchers.sourceId, kasBankId),
      activeRows()
    ));

  if (existing) {
    throw new Error('Voucher already exists for this Kas Bank transaction');
  }

  // Get the transaction
  const [transaction] = await db.select()
    .from(kasBankTransactions)
    .where(eq(kasBankTransactions.id, kasBankId));

  if (!transaction) {
    throw new Error('Kas Bank transaction not found');
  }

  const period = await db.select()
    .from(accountingPeriods)
    .where(eq(accountingPeriods.id, transaction.periodId))
    .then(rows => rows[0]);

  if (!period) {
    throw new Error('Period not found');
  }

  const inflow = Number(transaction.inflow || 0);
  const outflow = Number(transaction.outflow || 0);
  const amount = Math.max(inflow, outflow);

  if (amount === 0) {
    throw new Error('Transaction has no inflow or outflow amount');
  }

  const kasBankAccount = '1110201'; // Kas Bank
  const counterpartAccount = transaction.coaAccount || '5110100'; // Expense/revenue from COA field

  // Get any detailed transaction lines for compound entries
  const linesData = await db.select()
    .from(kasBankTransactionLines)
    .where(eq(kasBankTransactionLines.kasBankTransactionId, kasBankId))
    .orderBy(asc(kasBankTransactionLines.id));

  // Build double-entry voucher lines
  // outflow > 0: cash going OUT → debit counterpart (expense), credit bank
  // inflow > 0:  cash coming IN → debit bank, credit counterpart (income)
  let lines;
  if (linesData.length > 0) {
    // Compound entry: use detailed lines + bank offset line
    const linesTotal = linesData.reduce((s, l) => s + Number(l.debit || 0) - Number(l.credit || 0), 0);
    lines = [
      ...linesData.map(l => ({
        accountNumber: l.accountNumber,
        accountName: l.accountName || l.accountNumber,
        description: l.description || transaction.description,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      })),
      // Bank offset line
      outflow > 0
        ? { accountNumber: kasBankAccount, accountName: 'Kas Bank', description: transaction.description, debit: 0, credit: outflow }
        : { accountNumber: kasBankAccount, accountName: 'Kas Bank', description: transaction.description, debit: inflow, credit: 0 },
    ];
  } else if (outflow > 0) {
    lines = [
      { accountNumber: counterpartAccount, accountName: counterpartAccount, description: transaction.description, debit: outflow, credit: 0 },
      { accountNumber: kasBankAccount, accountName: 'Kas Bank', description: transaction.description, debit: 0, credit: outflow },
    ];
  } else {
    lines = [
      { accountNumber: kasBankAccount, accountName: 'Kas Bank', description: transaction.description, debit: inflow, credit: 0 },
      { accountNumber: counterpartAccount, accountName: counterpartAccount, description: transaction.description, debit: 0, credit: inflow },
    ];
  }

  // Generate voucher number
  const voucherNumber = await generateVoucherNumber(period.year, period.month, 'KAS_BANK');

  const workflowLog = JSON.stringify([{
    from: null,
    to: 'APPROVED',
    action: 'AUTO_GENERATED',
    userId,
    timestamp: new Date().toISOString(),
    description: `Auto-generated from Kas Bank transaction ${transaction.transactionCode || transaction.transNumber}`,
  }]);

  const [voucher] = await db.insert(vouchers).values({
    periodId: transaction.periodId,
    voucherNumber,
    voucherType: 'KAS_BANK',
    date: transaction.date,
    payee: 'Bank',
    description: transaction.description,
    totalAmount: String(amount),
    paymentMethod: transaction.reference || null,
    status: 'APPROVED',
    sourceType: 'KAS_BANK',
    sourceId: kasBankId,
    workflowLog,
    attachmentUrl: null,
    createdBy: userId ?? null,
    preparedBy: userId ?? null,
    approvedBy: userId ?? null,
    approvedAt: new Date(),
  }).returning();

  // Create voucher lines
  await db.insert(voucherLines).values(
    lines.map((l) => ({
      voucherId: voucher.id,
      accountNumber: l.accountNumber,
      accountName: l.accountName || l.accountNumber,
      description: l.description ?? null,
      debit: String(l.debit ?? 0),
      credit: String(l.credit ?? 0),
    }))
  );

  // Auto-post to Buku Besar immediately
  try {
    await bukuBesarService.postFromVoucher(voucher);
  } catch (postError) {
    console.error('Auto-posting Kas Bank voucher to Buku Besar failed:', postError.message);
  }

  return getById(voucher.id);
};

// ── Workflow log helper ─────────────────────────────────────────────────────────────

const addWorkflowLogEntry = async (voucherId, action, from, to, userId, description) => {
  const [voucher] = await db.select({ workflowLog: vouchers.workflowLog })
    .from(vouchers)
    .where(eq(vouchers.id, voucherId));

  if (!voucher) throw new Error('Voucher not found');

  const raw = voucher.workflowLog;
  const log = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : []);
  log.push({
    from,
    to,
    action,
    userId,
    timestamp: new Date().toISOString(),
    description,
  });

  await db.update(vouchers)
    .set({ workflowLog: JSON.stringify(log) })
    .where(eq(vouchers.id, voucherId));
};

// ── Number generation ────────────────────────────────────────────────────────

export const generateVoucherNumber = async (year, month, voucherType) => {
  const prefix = voucherType === 'KAS_KECIL'
    ? `VKK/${year}/${String(month).padStart(2, '0')}/`
    : `VKB/${year}/${String(month).padStart(2, '0')}/`;

  const rows = await db.select({ voucherNumber: vouchers.voucherNumber })
    .from(vouchers)
    .where(sql`${vouchers.voucherNumber} LIKE ${prefix + '%'}`)
    .orderBy(asc(vouchers.voucherNumber));

  const seq = rows.length > 0
    ? Math.max(...rows.map(r => parseInt(r.voucherNumber.split('/').pop() ?? '0', 10))) + 1
    : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

// ── Validation helpers ────────────────────────────────────────────────────────

const validateBalance = (lines) => {
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit ?? 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit ?? 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.001) {
    throw new Error(`Voucher lines are not balanced: debit ${totalDebit} ≠ credit ${totalCredit}`);
  }
  return totalDebit;
};

// ── With lines helper ─────────────────────────────────────────────────────────

const withLines = async (voucher) => {
  if (!voucher) return null;
  const lines = await db.select()
    .from(voucherLines)
    .where(eq(voucherLines.voucherId, voucher.id))
    .orderBy(asc(voucherLines.id));
  return { ...voucher, lines };
};

// ── Transition guard ─────────────────────────────────────────────────────────

const assertStatus = (voucher, ...allowedStatuses) => {
  if (!allowedStatuses.includes(voucher.status)) {
    throw new Error(`Action not allowed: voucher is ${voucher.status}`);
  }
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

export const getByPeriod = async (periodId, voucherType) => {
  const conditions = [eq(vouchers.periodId, periodId), activeRows()];
  if (voucherType) conditions.push(eq(vouchers.voucherType, voucherType));

  const rows = await db.select()
    .from(vouchers)
    .where(and(...conditions))
    .orderBy(asc(vouchers.date), asc(vouchers.id));

  return Promise.all(rows.map(withLines));
};

export const getById = async (id) => {
  const [row] = await db.select()
    .from(vouchers)
    .where(and(eq(vouchers.id, id), activeRows()));
  return withLines(row ?? null);
};

export const create = async ({
  periodId, voucherType, date, payee, description, paymentMethod,
  lines, attachmentUrl, createdBy, year, month,
}) => {
  if (!lines || lines.length === 0) throw new Error('At least one voucher line is required');
  const totalAmount = validateBalance(lines);

  const voucherNumber = await generateVoucherNumber(year, month, voucherType);

  const [voucher] = await db.insert(vouchers).values({
    periodId,
    voucherNumber,
    voucherType,
    date,
    payee,
    description,
    totalAmount: String(totalAmount),
    paymentMethod: paymentMethod ?? null,
    status: 'DRAFT',
    attachmentUrl: attachmentUrl ?? null,
    createdBy: createdBy ?? null,
    preparedBy: createdBy ?? null,
  }).returning();

  const lineValues = lines.map((l) => ({
    voucherId: voucher.id,
    accountNumber: l.accountNumber,
    accountName: l.accountName,
    description: l.description ?? null,
    debit: String(l.debit ?? 0),
    credit: String(l.credit ?? 0),
  }));
  await db.insert(voucherLines).values(lineValues);

  return getById(voucher.id);
};

export const update = async (id, { date, payee, description, paymentMethod, lines, attachmentUrl, receivedBy }) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  assertStatus(existing, 'DRAFT');

  let totalAmount = String(existing.totalAmount);
  if (lines) {
    const total = validateBalance(lines);
    totalAmount = String(total);
    await db.delete(voucherLines).where(eq(voucherLines.voucherId, id));
    await db.insert(voucherLines).values(
      lines.map((l) => ({
        voucherId: id,
        accountNumber: l.accountNumber,
        accountName: l.accountName,
        description: l.description ?? null,
        debit: String(l.debit ?? 0),
        credit: String(l.credit ?? 0),
      }))
    );
  }

  await db.update(vouchers).set({
    date: date ?? existing.date,
    payee: payee ?? existing.payee,
    description: description ?? existing.description,
    paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
    totalAmount,
    attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existing.attachmentUrl,
    receivedBy: receivedBy !== undefined ? receivedBy : existing.receivedBy,
    updatedAt: new Date(),
  }).where(eq(vouchers.id, id));

  return getById(id);
};

// ── Workflow transitions ─────────────────────────────────────────────────────

export const submit = async (id, userId) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  assertStatus(existing, 'DRAFT');

  await addWorkflowLogEntry(id, 'SUBMIT', 'DRAFT', 'SUBMITTED', userId, 'Voucher submitted for review');

  const [updated] = await db.update(vouchers)
    .set({ status: 'SUBMITTED', updatedAt: new Date() })
    .where(eq(vouchers.id, id))
    .returning();
  return withLines(updated);
};

export const review = async (id, userId) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  assertStatus(existing, 'SUBMITTED');

  await addWorkflowLogEntry(id, 'REVIEW', 'SUBMITTED', 'REVIEWED', userId, 'Voucher reviewed and approved');

  const [updated] = await db.update(vouchers)
    .set({ status: 'REVIEWED', reviewedBy: userId ?? null, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(vouchers.id, id))
    .returning();
  return withLines(updated);
};

export const approve = async (id, userId) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  assertStatus(existing, 'REVIEWED');

  await addWorkflowLogEntry(id, 'APPROVE', 'REVIEWED', 'APPROVED', userId, 'Voucher approved');

  const [updated] = await db.update(vouchers)
    .set({ status: 'APPROVED', approvedBy: userId ?? null, approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(vouchers.id, id))
    .returning();

  // Auto-post to Buku Besar on approval
  try {
    await bukuBesarService.postFromVoucher(updated);
  } catch (postingError) {
    console.error('Auto-posting to Buku Besar failed:', postingError.message);
    // Log the error but don't fail the approval - voucher is approved but not posted
    // User can manually retry posting if needed
  }

  return withLines(updated);
};

export const markPaid = async (id, userId) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  assertStatus(existing, 'APPROVED');

  await addWorkflowLogEntry(id, 'MARK_PAID', 'APPROVED', 'PAID', userId, 'Voucher marked as paid');

  const [updated] = await db.update(vouchers)
    .set({ status: 'PAID', paidAt: new Date(), updatedAt: new Date() })
    .where(eq(vouchers.id, id))
    .returning();
  return withLines(updated);
};

export const reject = async (id, userId, reason) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  if (FINAL_STATUSES.includes(existing.status)) {
    throw new Error(`Cannot reject a voucher with status ${existing.status}`);
  }
  if (!reason) throw new Error('A rejection reason is required');

  await addWorkflowLogEntry(id, 'REJECT', existing.status, 'REJECTED', userId, `Voucher rejected: ${reason}`);

  const [updated] = await db.update(vouchers)
    .set({ status: 'REJECTED', rejectionReason: reason, reviewedBy: userId ?? null, updatedAt: new Date() })
    .where(eq(vouchers.id, id))
    .returning();
  return withLines(updated);
};

export const cancel = async (id, userId) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  assertStatus(existing, 'DRAFT', 'SUBMITTED');

  await addWorkflowLogEntry(id, 'CANCEL', existing.status, 'CANCELLED', userId, 'Voucher cancelled');

  const [updated] = await db.update(vouchers)
    .set({ status: 'CANCELLED', updatedAt: new Date() })
    .where(eq(vouchers.id, id))
    .returning();
  return withLines(updated);
};

export const remove = async (id) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Voucher not found');
  assertStatus(existing, 'DRAFT', 'CANCELLED');

  await db.update(vouchers)
    .set({ deletedAt: new Date() })
    .where(eq(vouchers.id, id));
};
