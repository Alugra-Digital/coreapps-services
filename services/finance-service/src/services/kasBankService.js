import { db, pool } from '../../../shared/db/index.js';
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
  // Include soft-deleted rows to avoid unique constraint violations
  const rows = await db.select({ transactionCode: kasBankTransactions.transactionCode })
    .from(kasBankTransactions)
    .where(sql`${kasBankTransactions.transactionCode} LIKE ${prefix + '%'}`)
    .orderBy(asc(kasBankTransactions.transactionCode));

  const seqs = rows.map(r => parseInt(r.transactionCode?.split('/').pop() ?? '0', 10)).filter(n => !isNaN(n));
  const seq = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
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

  // Use a session-level pg advisory lock to serialise the generate+insert
  // critical section. This prevents concurrent requests from computing the
  // same MAX+1 transactionCode before either has committed its INSERT.
  // pg_advisory_lock blocks until the lock is free; pg_advisory_unlock
  // releases it explicitly after the INSERT, so another request can proceed.
  // Use classid=1002 as namespace for kas-bank sequence locks
  // objid = periodId (the natural unique identifier for the period)
  // This ensures no collision with other advisory locks
  const KAS_BANK_LOCK_NAMESPACE = 1002;
  const client = await pool.connect();
  let insertedId;
  try {
    await client.query('SELECT pg_advisory_lock($1, $2)', [KAS_BANK_LOCK_NAMESPACE, periodId]);
    try {
      const type = inflow > 0 ? 'inflow' : 'outflow';
      const prefix = type === 'inflow' ? `BM/${String(month).padStart(2, '0')}/` : `BK/${String(month).padStart(2, '0')}/`;
      const seqRows = await client.query(
        `SELECT transaction_code FROM kas_bank_transactions WHERE transaction_code LIKE $1 ORDER BY transaction_code`,
        [prefix + '%']
      );
      const seqs = seqRows.rows
        .map(r => parseInt(r.transaction_code?.split('/').pop() ?? '0', 10))
        .filter(n => !isNaN(n));
      const seq = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
      const transactionCode = `${prefix}${String(seq).padStart(4, '0')}`;

      const insertRes = await client.query(
        `INSERT INTO kas_bank_transactions
           (period_id, transaction_code, trans_number, date, coa_account, description,
            inflow, outflow, running_balance, reference, created_by, voucher_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          periodId,
          transactionCode,
          transactionCode, // Legacy field for compatibility
          date,
          coaAccount,
          description,
          String(inflow ?? 0),
          String(outflow ?? 0),
          '0',
          reference ?? null,
          createdBy ?? null,
          voucherCode ?? null,
        ]
      );
      insertedId = insertRes.rows[0].id;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1, $2)', [KAS_BANK_LOCK_NAMESPACE, periodId]);
    }
  } finally {
    client.release();
  }

  // Create transaction lines if provided
  if (lines && lines.length > 0) {
    await createTransactionLines(insertedId, lines);
  }

  await recalcRunningBalance(periodId);
  return getByIdWithLines(insertedId);
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
