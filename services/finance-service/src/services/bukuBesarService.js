import { db } from '../../../shared/db/index.js';
import { bukuBesar, vouchers, voucherLines, accounts } from '../../../shared/db/schema.js';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';
import * as neracaSaldoService from './neracaSaldoService.js';

const activeRows = () => isNull(bukuBesar.deletedAt);

/**
 * Post voucher to Buku Besar (General Ledger)
 * Creates entries for each voucher line and updates running balances
 * Auto-generates Neraca Saldo after posting
 * @param {Object} voucher - The voucher object with lines
 * @param {boolean} autoGenerateNeraca - Whether to auto-generate Neraca Saldo (default: true)
 */
export const postFromVoucher = async (voucher, autoGenerateNeraca = true) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Get voucher lines
    const lines = await db.select()
      .from(voucherLines)
      .where(eq(voucherLines.voucherId, voucher.id));

    if (lines.length === 0) {
      throw new Error('Voucher has no lines to post');
    }

    // Create buku_besar entries for each line
    for (const line of lines) {
      await client.query(
        `INSERT INTO buku_besar
         (period_id, account_number, account_name, voucher_number, source_type, source_id,
          date, debit, credit, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          voucher.periodId,
          line.accountNumber,
          line.accountName || null,
          voucher.voucherNumber,
          'VOUCHER',
          voucher.id,
          voucher.date,
          line.debit || '0',
          line.credit || '0',
          voucher.description,
        ]
      );
    }

    // Update running balances for each account
    await client.query(`
      UPDATE buku_besar bb
      SET running_balance = (
        SELECT SUM(COALESCE(debit, 0) - COALESCE(credit, 0))
        FROM buku_besar bb2
        WHERE bb2.period_id = $1
          AND bb2.account_number = bb.account_number
          AND bb2.date <= $2
          AND bb2.deleted_at IS NULL
      )
      WHERE bb.period_id = $1
        AND bb.account_number IN (
          SELECT DISTINCT account_number
          FROM buku_besar
          WHERE period_id = $1
            AND source_id = $3
            AND source_type = 'VOUCHER'
        )
        AND bb.date = $2
        AND bb.deleted_at IS NULL
    `, [voucher.periodId, voucher.date, voucher.id]);

    await client.query('COMMIT');
    console.log(`Posted voucher ${voucher.voucherNumber} to Buku Besar`);

    // Auto-generate Neraca Saldo after posting (outside transaction for performance)
    if (autoGenerateNeraca) {
      try {
        await neracaSaldoService.generateNeracaSaldo(voucher.periodId);
        console.log(`Auto-generated Neraca Saldo for period ${voucher.periodId}`);
      } catch (neracaError) {
        console.error('Auto-generating Neraca Saldo failed:', neracaError.message);
        // Don't fail the posting - log and continue
      }
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Get Buku Besar entries for a specific account in a period
 */
export const getByPeriodAndAccount = async (periodId, accountNumber) => {
  const entries = await db.select()
    .from(bukuBesar)
    .where(and(
      eq(bukuBesar.periodId, periodId),
      eq(bukuBesar.accountNumber, accountNumber),
      activeRows()
    ))
    .orderBy(asc(bukuBesar.date), asc(bukuBesar.id));

  // Join with accounts to get account details
  const results = await Promise.all(entries.map(async (entry) => {
    const [account] = await db.select()
      .from(accounts)
      .where(eq(accounts.code, entry.accountNumber));
    return {
      ...entry,
      accountName: account?.name || entry.accountName,
      normalBalance: account?.normalBalance || 'DEBIT',
    };
  }));

  return results;
};

/**
 * Get all Buku Besar entries for a period (for aggregation)
 */
export const getPeriodEntries = async (periodId) => {
  return db.select()
    .from(bukuBesar)
    .where(and(
      eq(bukuBesar.periodId, periodId),
      activeRows()
    ))
    .orderBy(asc(bukuBesar.date), asc(bukuBesar.id));
};

/**
 * Get all Buku Besar entries for a period with account details
 */
export const getByPeriod = async (periodId, options = {}) => {
  const { accountNumber } = options;
  const conditions = [eq(bukuBesar.periodId, periodId), activeRows()];
  if (accountNumber) {
    conditions.push(eq(bukuBesar.accountNumber, accountNumber));
  }

  const entries = await db.select()
    .from(bukuBesar)
    .where(and(...conditions))
    .orderBy(asc(bukuBesar.date), asc(bukuBesar.id));

  // Enrich with account information
  const enrichedEntries = await Promise.all(entries.map(async (entry) => {
    const [account] = await db.select()
      .from(accounts)
      .where(eq(accounts.code, entry.accountNumber));
    return {
      ...entry,
      accountName: account?.name || entry.accountName,
      accountType: account?.type || null,
      normalBalance: account?.normalBalance || 'DEBIT',
    };
  }));

  return enrichedEntries;
};

/**
 * Get summary for all accounts in a period
 */
export const getPeriodSummary = async (periodId) => {
  const summary = await db.execute(sql`
    SELECT
      account_number,
      account_name,
      SUM(COALESCE(debit, 0)) as total_debit,
      SUM(COALESCE(credit, 0)) as total_credit,
      SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) as net_balance
    FROM buku_besar
    WHERE period_id = ${periodId}
      AND deleted_at IS NULL
    GROUP BY account_number, account_name
    ORDER BY account_number
  `);

  return summary.rows;
};
