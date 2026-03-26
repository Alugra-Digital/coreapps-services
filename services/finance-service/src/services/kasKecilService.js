import { db, pool } from '../../../shared/db/index.js';
import { kasKecilTransactions, accountingPeriods, cashReconciliations } from '../../../shared/db/schema.js';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';

const activeRows = () => isNull(kasKecilTransactions.deletedAt);

// ── Validation helpers ──────────────────────────────────────────────────────────

export const checkVoucherCodeUnique = async (periodId, voucherCode, excludeId = null) => {
  if (!voucherCode) return true; // Allow null/undefined values

  const conditions = [
    eq(kasKecilTransactions.periodId, periodId),
    eq(kasKecilTransactions.voucherCode, voucherCode),
    activeRows()
  ];

  if (excludeId) {
    conditions.push(sql`${kasKecilTransactions.id} != ${excludeId}`);
  }

  const [existing] = await db.select({ id: kasKecilTransactions.id })
    .from(kasKecilTransactions)
    .where(and(...conditions));

  if (existing) {
    throw new Error(`Voucher code "${voucherCode}" already exists in this period`);
  }

  return true;
};

// ── Number generation ────────────────────────────────────────────────────────

// WARNING: This function is NOT concurrency-safe. Use the create() function
// which wraps number generation in a PostgreSQL advisory lock.
export const generateTransNumber = async (year, month) => {
  const prefix = `KK/${year}/${String(month).padStart(2, '0')}/`;
  // Include soft-deleted rows to avoid unique constraint violations
  const rows = await db.select({ transNumber: kasKecilTransactions.transNumber })
    .from(kasKecilTransactions)
    .where(sql`${kasKecilTransactions.transNumber} LIKE ${prefix + '%'}`)
    .orderBy(asc(kasKecilTransactions.transNumber));

  const seqs = rows.map(r => parseInt(r.transNumber?.split('/').pop() ?? '0', 10)).filter(n => !isNaN(n));
  const seq = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

// ── Running balance helpers ──────────────────────────────────────────────────

const recalcRunningBalance = async (periodId) => {
  const rows = await db.select()
    .from(kasKecilTransactions)
    .where(and(eq(kasKecilTransactions.periodId, periodId), activeRows()))
    .orderBy(asc(kasKecilTransactions.date), asc(kasKecilTransactions.id));

  let balance = 0;
  for (const row of rows) {
    balance += Number(row.debit) - Number(row.credit);
    await db.update(kasKecilTransactions)
      .set({ runningBalance: String(balance) })
      .where(eq(kasKecilTransactions.id, row.id));
  }
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

export const getByPeriod = async (periodId) => {
  return db.select()
    .from(kasKecilTransactions)
    .where(and(eq(kasKecilTransactions.periodId, periodId), activeRows()))
    .orderBy(asc(kasKecilTransactions.date), asc(kasKecilTransactions.id));
};

export const getById = async (id) => {
  const [row] = await db.select()
    .from(kasKecilTransactions)
    .where(and(eq(kasKecilTransactions.id, id), activeRows()));
  return row ?? null;
};

export const getSummary = async (periodId) => {
  const rows = await getByPeriod(periodId);
  const totalDebit = rows.reduce((s, r) => s + Number(r.debit), 0);
  const totalCredit = rows.reduce((s, r) => s + Number(r.credit), 0);
  const closingBalance = rows.length > 0 ? Number(rows[rows.length - 1].runningBalance) : 0;
  return { totalDebit, totalCredit, closingBalance };
};

export const create = async ({ periodId, date, description, debit, credit, attachmentUrl, accountNumber, accountName, createdBy, year, month, saldoFromPeriodId, voucherCode, coaAccount }) => {
  // Validate voucher code uniqueness
  await checkVoucherCodeUnique(periodId, voucherCode);

  // Use a session-level pg advisory lock to serialise the generate+insert
  // critical section. This prevents concurrent requests from computing the
  // same MAX+1 transNumber before either has committed its INSERT.
  // pg_advisory_lock blocks until the lock is free; pg_advisory_unlock
  // releases it explicitly after the INSERT, so another request can proceed.
  // Use classid=1001 as namespace for kas-kecil sequence locks
  // objid = periodId (the natural unique identifier for the period)
  // This ensures no collision with other advisory locks
  const KAS_KECIL_LOCK_NAMESPACE = 1001;
  const client = await pool.connect();
  let insertedId;
  try {
    await client.query('SELECT pg_advisory_lock($1, $2)', [KAS_KECIL_LOCK_NAMESPACE, periodId]);
    try {
      const prefix = `KK/${year}/${String(month).padStart(2, '0')}/`;
      const seqRows = await client.query(
        `SELECT trans_number FROM kas_kecil_transactions WHERE trans_number LIKE $1 ORDER BY trans_number`,
        [prefix + '%']
      );
      const seqs = seqRows.rows
        .map(r => parseInt(r.trans_number?.split('/').pop() ?? '0', 10))
        .filter(n => !isNaN(n));
      const seq = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
      const transNumber = `${prefix}${String(seq).padStart(3, '0')}`;

      const insertRes = await client.query(
        `INSERT INTO kas_kecil_transactions
           (period_id, trans_number, date, description, debit, credit, running_balance,
            coa_account, attachment_url, created_by, voucher_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          periodId,
          transNumber,
          date,
          description,
          String(debit ?? 0),
          String(credit ?? 0),
          '0',
          coaAccount ?? null,
          attachmentUrl ?? null,
          createdBy ?? null,
          voucherCode ?? null,
        ]
      );
      insertedId = insertRes.rows[0].id;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1, $2)', [KAS_KECIL_LOCK_NAMESPACE, periodId]);
    }
  } finally {
    client.release();
  }

  await recalcRunningBalance(periodId);
  return getById(insertedId);
};

export const update = async (id, { date, description, debit, credit, attachmentUrl, accountNumber, accountName, voucherCode }) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Transaction not found');

  // Validate voucher code uniqueness if it's being changed
  if (voucherCode !== undefined && voucherCode !== existing.voucherCode) {
    await checkVoucherCodeUnique(existing.periodId, voucherCode, id);
  }

  await db.update(kasKecilTransactions).set({
    date: date ?? existing.date,
    description: description ?? existing.description,
    debit: String(debit ?? existing.debit),
    credit: String(credit ?? existing.credit),
    attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existing.attachmentUrl,
    voucherCode: voucherCode !== undefined ? voucherCode : existing.voucherCode,
    updatedAt: new Date(),
  }).where(eq(kasKecilTransactions.id, id));

  await recalcRunningBalance(existing.periodId);
  return getById(id);
};

export const remove = async (id) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Transaction not found');
  await db.update(kasKecilTransactions)
    .set({ deletedAt: new Date() })
    .where(eq(kasKecilTransactions.id, id));
  await recalcRunningBalance(existing.periodId);
};

// ─── Cash Reconciliation ───────────────────────────────────────────────

export const getReconciliation = async (kasKecilTransactionId) => {
  const [reconciliation] = await db.select()
    .from(cashReconciliations)
    .where(eq(cashReconciliations.kasKecilTransactionId, kasKecilTransactionId))
    .orderBy(desc(cashReconciliations.createdAt))
    .limit(1);
  return reconciliation || null;
};

export const reconcileCash = async (data) => {
  const {
    periodId,
    kasKecilTransactionId,
    paper100000Qty = 0, paper50000Qty = 0, paper20000Qty = 0, paper10000Qty = 0,
    paper5000Qty = 0, paper2000Qty = 0, paper1000Qty = 0, coin1000Qty = 0,
    coin500Qty = 0, coin200Qty = 0, coin100Qty = 0, notes,
  } = data;

  // Get system balance from the transaction
  const [transaction] = await db.select()
    .from(kasKecilTransactions)
    .where(eq(kasKecilTransactions.id, kasKecilTransactionId))
    .limit(1);

  if (!transaction) throw new Error('Transaction not found');

  const systemBalance = Number(transaction.runningBalance);

  // Calculate total physical cash
  const totalPhysical = (
    (paper100000Qty * 100000) +
    (paper50000Qty * 50000) +
    (paper20000Qty * 20000) +
    (paper10000Qty * 10000) +
    (paper5000Qty * 5000) +
    (paper2000Qty * 2000) +
    (paper1000Qty * 1000) +
    (coin1000Qty * 1000) +
    (coin500Qty * 500) +
    (coin200Qty * 200) +
    (coin100Qty * 100)
  );

  const difference = totalPhysical - systemBalance;

  // Check if reconciliation already exists for this transaction
  const existingReconciliation = await getReconciliation(kasKecilTransactionId);

  let reconciliation;
  if (existingReconciliation) {
    // Update existing reconciliation
    [reconciliation] = await db.update(cashReconciliations)
      .set({
        totalPhysical,
        systemBalance,
        difference,
        notes: notes ?? existingReconciliation.notes,
        reconciledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cashReconciliations.id, existingReconciliation.id))
      .returning();
  } else {
    // Create new reconciliation
    [reconciliation] = await db.insert(cashReconciliations).values({
      periodId,
      kasKecilTransactionId,
      totalPhysical,
      systemBalance,
      difference,
      notes,
      reconciledAt: new Date(),
      createdAt: new Date(),
    }).returning();
  }

  return reconciliation;
};
