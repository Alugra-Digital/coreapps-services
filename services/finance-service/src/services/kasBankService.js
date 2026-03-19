import { db } from '../../../shared/db/index.js';
import { kasBankTransactions, kasBankTransactionLines } from '../../../shared/db/schema.js';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';

const activeRows = () => isNull(kasBankTransactions.deletedAt);

// ── Validation helpers ──────────────────────────────────────────────────────────

export const checkVoucherCodeUnique = async (periodId, voucherCode, excludeId = null) => {
  if (!voucherCode) return true; // Allow null/undefined values

  const conditions = [
    eq(kasBankTransactions.periodId, periodId),
    eq(kasBankTransactions.voucherCode, voucherCode),
    activeRows()
  ];

  if (excludeId) {
    conditions.push(sql`${kasBankTransactions.id} != ${excludeId}`);
  }

  const [existing] = await db.select({ id: kasBankTransactions.id })
    .from(kasBankTransactions)
    .where(and(...conditions));

  if (existing) {
    throw new Error(`Voucher code "${voucherCode}" already exists in this period`);
  }

  return true;
};

// ── Transaction code generation ───────────────────────────────────────────────────
// Format: BK/MM/xxxx (Bank Keluar) or BM/MM/xxxx (Bank Masuk)
export const generateTransactionCode = async (year, month, type) => {
  const prefix = type === 'inflow' ? `BM/${String(month).padStart(2, '0')}/` : `BK/${String(month).padStart(2, '0')}/`;
  const rows = await db.select({ transactionCode: kasBankTransactions.transactionCode })
    .from(kasBankTransactions)
    .where(
      and(
        sql`${kasBankTransactions.transactionCode} LIKE ${prefix + '%'}`,
        activeRows()
      )
    )
    .orderBy(asc(kasBankTransactions.transactionCode));

  const seq = rows.length > 0
    ? Math.max(...rows.map(r => parseInt(r.transactionCode.split('/').pop() ?? '0', 10))) + 1
    : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

// ── Transaction lines helpers ────────────────────────────────────────────────────

export const getTransactionLines = async (kasBankTransactionId) => {
  return db.select()
    .from(kasBankTransactionLines)
    .where(eq(kasBankTransactionLines.kasBankTransactionId, kasBankTransactionId))
    .orderBy(asc(kasBankTransactionLines.id));
};

export const createTransactionLines = async (kasBankTransactionId, lines) => {
  if (!lines || lines.length === 0) return [];

  const inserted = await db.insert(kasBankTransactionLines)
    .values(lines.map(line => ({
      kasBankTransactionId,
      accountNumber: line.accountNumber,
      accountName: line.accountName || null,
      debit: String(line.debit || 0),
      credit: String(line.credit || 0),
      description: line.description || null,
    })))
    .returning();
  return inserted;
};

export const deleteTransactionLines = async (kasBankTransactionId) => {
  await db.delete(kasBankTransactionLines)
    .where(eq(kasBankTransactionLines.kasBankTransactionId, kasBankTransactionId));
};

// ── Running balance helpers ──────────────────────────────────────────────────

const recalcRunningBalance = async (periodId) => {
  const rows = await db.select()
    .from(kasBankTransactions)
    .where(and(eq(kasBankTransactions.periodId, periodId), activeRows()))
    .orderBy(asc(kasBankTransactions.date), asc(kasBankTransactions.id));

  let balance = 0;
  for (const row of rows) {
    balance += Number(row.inflow) - Number(row.outflow);
    await db.update(kasBankTransactions)
      .set({ runningBalance: String(balance) })
      .where(eq(kasBankTransactions.id, row.id));
  }
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

export const getByPeriod = async (periodId, coaAccount) => {
  const conditions = [eq(kasBankTransactions.periodId, periodId), activeRows()];
  if (coaAccount) conditions.push(eq(kasBankTransactions.coaAccount, coaAccount));

  return db.select()
    .from(kasBankTransactions)
    .where(and(...conditions))
    .orderBy(asc(kasBankTransactions.date), asc(kasBankTransactions.id));
};

export const getById = async (id) => {
  const [row] = await db.select()
    .from(kasBankTransactions)
    .where(and(eq(kasBankTransactions.id, id), activeRows()));
  return row ?? null;
};

export const getByIdWithLines = async (id) => {
  const [row] = await db.select()
    .from(kasBankTransactions)
    .where(and(eq(kasBankTransactions.id, id), activeRows()));
  if (!row) return null;

  const lines = await getTransactionLines(id);
  return { ...row, lines };
};

export const getSummary = async (periodId) => {
  const rows = await getByPeriod(periodId);
  const totalInflow = rows.reduce((s, r) => s + Number(r.inflow), 0);
  const totalOutflow = rows.reduce((s, r) => s + Number(r.outflow), 0);
  const closingBalance = rows.length > 0 ? Number(rows[rows.length - 1].runningBalance) : 0;
  return { totalInflow, totalOutflow, closingBalance };
};

export const create = async ({ periodId, date, coaAccount, description, inflow, outflow, reference, createdBy, year, month, lines, voucherCode }) => {
  // Validate voucher code uniqueness
  await checkVoucherCodeUnique(periodId, voucherCode);

  const type = inflow > 0 ? 'inflow' : 'outflow';
  const transactionCode = await generateTransactionCode(year, month, type);
  const [row] = await db.insert(kasBankTransactions).values({
    periodId,
    transactionCode,
    transNumber: transactionCode, // Legacy field for compatibility
    date,
    coaAccount,
    description,
    inflow: String(inflow ?? 0),
    outflow: String(outflow ?? 0),
    runningBalance: '0',
    reference: reference ?? null,
    createdBy: createdBy ?? null,
    voucherCode: voucherCode ?? null,
  }).returning();

  // Create transaction lines if provided
  if (lines && lines.length > 0) {
    await createTransactionLines(row.id, lines);
  }

  await recalcRunningBalance(periodId);
  return getByIdWithLines(row.id);
};

export const update = async (id, { date, coaAccount, description, inflow, outflow, reference, lines, voucherCode }) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Transaction not found');

  // Validate voucher code uniqueness if it's being changed
  if (voucherCode !== undefined && voucherCode !== existing.voucherCode) {
    await checkVoucherCodeUnique(existing.periodId, voucherCode, id);
  }

  await db.update(kasBankTransactions).set({
    date: date ?? existing.date,
    coaAccount: coaAccount ?? existing.coaAccount,
    description: description ?? existing.description,
    inflow: String(inflow ?? existing.inflow),
    outflow: String(outflow ?? existing.outflow),
    reference: reference !== undefined ? reference : existing.reference,
    voucherCode: voucherCode !== undefined ? voucherCode : existing.voucherCode,
    updatedAt: new Date(),
  }).where(eq(kasBankTransactions.id, id));

  // Update transaction lines if provided
  if (lines !== undefined) {
    await deleteTransactionLines(id);
    if (lines.length > 0) {
      await createTransactionLines(id, lines);
    }
  }

  await recalcRunningBalance(existing.periodId);
  return getByIdWithLines(id);
};

export const remove = async (id) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Transaction not found');
  await db.update(kasBankTransactions)
    .set({ deletedAt: new Date() })
    .where(eq(kasBankTransactions.id, id));
  await recalcRunningBalance(existing.periodId);
};
