import { db } from '../../../shared/db/index.js';
import { accountingPeriods, kasKecilTransactions, kasBankTransactions } from '../../../shared/db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as neracaSaldoService from './neracaSaldoService.js';

export const getAllPeriods = async () => {
  return db.select().from(accountingPeriods).orderBy(desc(accountingPeriods.year), desc(accountingPeriods.month));
};

export const getPeriodById = async (id) => {
  const [period] = await db.select().from(accountingPeriods).where(eq(accountingPeriods.id, id));
  return period ?? null;
};

export const getPeriodByYearMonth = async (year, month) => {
  const [period] = await db.select().from(accountingPeriods).where(
    and(eq(accountingPeriods.year, year), eq(accountingPeriods.month, month))
  );
  return period ?? null;
};

export const createPeriod = async ({ year, month }) => {
  const existing = await getPeriodByYearMonth(year, month);
  if (existing) throw new Error(`Period ${year}/${String(month).padStart(2, '0')} already exists`);
  const [period] = await db.insert(accountingPeriods).values({ year, month, status: 'OPEN' }).returning();
  return period;
};

export const closePeriod = async (id, userId) => {
  const period = await getPeriodById(id);
  if (!period) throw new Error('Period not found');
  if (period.status !== 'OPEN') throw new Error(`Cannot close a period with status ${period.status}`);

  const [updated] = await db.update(accountingPeriods)
    .set({ status: 'CLOSED', closedAt: new Date(), closedBy: userId })
    .where(eq(accountingPeriods.id, id))
    .returning();

  // Auto-generate Neraca Saldo when closing period
  try {
    await neracaSaldoService.generateNeracaSaldo(id);
    console.log(`Auto-generated Neraca Saldo for period ${id} (${period.year}/${period.month})`);
  } catch (neracaError) {
    console.error('Auto-generating Neraca Saldo failed on period close:', neracaError.message);
    // Don't fail the period close - log and continue
  }

  return updated;
};

export const reopenPeriod = async (id, userId, reason) => {
  const period = await getPeriodById(id);
  if (!period) throw new Error('Period not found');
  if (period.status === 'OPEN') throw new Error('Period is already open');
  if (period.status === 'LOCKED') throw new Error('Locked periods cannot be reopened');
  if (!reason) throw new Error('A reason is required to reopen a period');

  const [updated] = await db.update(accountingPeriods)
    .set({ status: 'OPEN', reopenedAt: new Date(), reopenedReason: reason })
    .where(eq(accountingPeriods.id, id))
    .returning();
  return updated;
};

export const lockPeriod = async (id) => {
  const period = await getPeriodById(id);
  if (!period) throw new Error('Period not found');
  if (period.status !== 'CLOSED') throw new Error('Only closed periods can be locked');

  const [updated] = await db.update(accountingPeriods)
    .set({ status: 'LOCKED' })
    .where(eq(accountingPeriods.id, id))
    .returning();
  return updated;
};

/**
 * Gets or creates a period and returns the opening balance for Kas Kecil
 * (closing balance of prior month, or 0 if none exists).
 */
export const getOrCreateNextMonthPeriod = async (year, month) => {
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) { nextMonth = 1; nextYear++; }

  const existing = await getPeriodByYearMonth(nextYear, nextMonth);
  if (existing) return existing;

  return createPeriod({ year: nextYear, month: nextMonth });
};

// ============================================================
// NEW FUNCTIONS FOR REQUIREMENT 2.0
// ============================================================

/**
 * Validates if a period can be closed
 * Returns warnings and errors
 */
export const validateClosePeriod = async (periodId) => {
  const period = await getPeriodById(periodId);
  if (!period) throw new Error('Period not found');

  const warnings = [];
  const errors = [];

  // Check 1: All vouchers should be APPROVED or REJECTED/CANCELLED
  const pendingVouchers = await db.execute(sql`
    SELECT COUNT(*) as count FROM vouchers
    WHERE period_id = ${periodId} AND status IN ('DRAFT', 'SUBMITTED', 'REVIEWED')
  `);
  const pendingVoucherCount = Number(pendingVouchers.rows[0]?.count || 0);
  if (pendingVoucherCount > 0) {
    errors.push(`${pendingVoucherCount} vouchers are still in draft/submitted/reviewed status`);
  }

  // Check 2: Physical cash reconciliation (WARNING only, not blocking)
  const unreconciledCash = await db.execute(sql`
    SELECT COUNT(*) as count FROM cash_reconciliations
    WHERE period_id = ${periodId}
  `);
  const cashReconciliationCount = Number(unreconciledCash.rows[0]?.count || 0);
  if (cashReconciliationCount === 0) {
    warnings.push('Physical cash reconciliation has not been performed (optional but recommended)');
  }

  // Check 3: Jurnal Penyusutan for all active assets (will be added later)
  // This is a placeholder for the batch generation check

  return {
    canClose: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * Creates the next period with carry-forward balances and resets numbering
 */
export const createNextPeriod = async (currentPeriodId) => {
  const currentPeriod = await getPeriodById(currentPeriodId);
  if (!currentPeriod) throw new Error('Current period not found');

  // Calculate next month/year
  let nextYear = currentPeriod.year;
  let nextMonth = currentPeriod.month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }

  // Check if next period already exists
  const existingNext = await getPeriodByYearMonth(nextYear, nextMonth);
  if (existingNext) throw new Error(`Period ${nextYear}/${String(nextMonth).padStart(2, '0')} already exists`);

  // Get closing balances from current period
  const [kasKecilClosing] = await db.execute(sql`
    SELECT running_balance
    FROM kas_kecil_transactions
    WHERE period_id = ${currentPeriodId}
    ORDER BY id DESC
    LIMIT 1
  `);

  const [kasBankClosing] = await db.execute(sql`
    SELECT running_balance
    FROM kas_bank_transactions
    WHERE period_id = ${currentPeriodId}
    ORDER BY id DESC
    LIMIT 1
  `);

  const openingBalances = {
    kasKecil: Number(kasKecilClosing.rows[0]?.running_balance || 0),
    kasBank: Number(kasBankClosing.rows[0]?.running_balance || 0),
  };

  // Determine if we need to reset numbering sequences (new year)
  const resetSequences = nextMonth === 1;

  // Create new period
  const [newPeriod] = await db.insert(accountingPeriods).values({
    year: nextYear,
    month: nextMonth,
    status: 'OPEN',
    periodOpeningBalances: openingBalances,
    kkSequence: resetSequences ? 0 : (currentPeriod.kkSequence || 0),
    kmSequence: resetSequences ? 0 : (currentPeriod.kmSequence || 0),
    bkSequence: resetSequences ? 0 : (currentPeriod.bkSequence || 0),
    bmSequence: resetSequences ? 0 : (currentPeriod.bmSequence || 0),
    jmSequence: resetSequences ? 0 : (currentPeriod.jmSequence || 0),
  }).returning();

  return newPeriod;
};

/**
 * Generates the next number for a given transaction type
 * @param {number} periodId - The period ID
 * @param {string} type - Transaction type: 'KK', 'KM', 'BK', 'BM', 'JM'
 * @returns {string} The next transaction code (e.g., 'KK/01/0001')
 */
export const generateNextNumber = async (periodId, type) => {
  const period = await getPeriodById(periodId);
  if (!period) throw new Error('Period not found');

  let sequenceField;
  let prefix;

  switch (type) {
    case 'KK': // Kas Kecil Keluar
      sequenceField = 'kkSequence';
      prefix = 'KK';
      break;
    case 'KM': // Kas Masuk
      sequenceField = 'kmSequence';
      prefix = 'KM';
      break;
    case 'KB': // Kas Bank (all bank transactions)
      sequenceField = 'bkSequence';
      prefix = 'KB';
      break;
    case 'BK': // Bank Keluar
      sequenceField = 'bkSequence';
      prefix = 'BK';
      break;
    case 'BM': // Bank Masuk
      sequenceField = 'bmSequence';
      prefix = 'BM';
      break;
    case 'JM': // Jurnal Memorial/Memori/Penyusutan
      sequenceField = 'jmSequence';
      prefix = 'JM';
      break;
    default:
      throw new Error(`Invalid transaction type: ${type}`);
  }

  // Increment the sequence
  const nextSequence = (period[sequenceField] || 0) + 1;

  // Update the period with new sequence
  await db.update(accountingPeriods)
    .set({ [sequenceField]: nextSequence })
    .where(eq(accountingPeriods.id, periodId));

  // Generate the transaction code
  const month = String(period.month).padStart(2, '0');
  const sequence = String(nextSequence).padStart(4, '0');
  const yearShort = String(period.year).slice(-2);

  // Format: KK/MM/0001, JM/MM/YY/001 (for JM)
  if (type === 'JM') {
    return `${prefix}/${month}/${yearShort}/${sequence}`;
  } else {
    return `${prefix}/${month}/${sequence}`;
  }
};

/**
 * Gets the last OPEN period (for navigation)
 */
export const getLastOpenPeriod = async () => {
  const [period] = await db.select()
    .from(accountingPeriods)
    .where(eq(accountingPeriods.status, 'OPEN'))
    .orderBy(desc(accountingPeriods.year), desc(accountingPeriods.month))
    .limit(1);
  return period ?? null;
};
