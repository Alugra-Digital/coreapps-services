import { db } from '../../../shared/db/index.js';
import {
  accounts,
  neracaSaldo,
  bukuBesar,
  accountingPeriods,
} from '../../../shared/db/schema.js';
import { eq, and, isNull, asc } from 'drizzle-orm';

const activeRows = () => isNull(neracaSaldo.deletedAt);

// ── Helper Functions ───────────────────────────────────────────────

/**
 * Get previous accounting period
 */
const getPreviousPeriod = async (currentPeriodId) => {
  const [currentPeriod] = await db.select()
    .from(accountingPeriods)
    .where(eq(accountingPeriods.id, currentPeriodId));

  if (!currentPeriod) return null;

  // Find the previous month/year
  let prevYear = currentPeriod.year;
  let prevMonth = currentPeriod.month - 1;

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }

  const [previousPeriod] = await db.select()
    .from(accountingPeriods)
    .where(and(
      eq(accountingPeriods.year, prevYear),
      eq(accountingPeriods.month, prevMonth)
    ));

  return previousPeriod ?? null;
};

/**
 * Get Neraca Saldo for a period
 */
export const getByPeriod = async (periodId) => {
  const entries = await db.select()
    .from(neracaSaldo)
    .where(and(
      eq(neracaSaldo.periodId, periodId),
      activeRows()
    ))
    .orderBy(asc(neracaSaldo.accountNumber));

  return entries;
};

/**
 * Generate Neraca Saldo entries for a period from Buku Besar
 * Aggregates all transactions from Buku Besar and calculates trial balance
 */
export const generateNeracaSaldo = async (periodId) => {
  // Get all accounts
  const allAccounts = await db.select()
    .from(accounts)
    .where(isNull(accounts.deletedAt))
    .orderBy(asc(accounts.code));

  // Get Buku Besar entries for this period
  const bukuBesarEntries = await db.select()
    .from(bukuBesar)
    .where(and(
      eq(bukuBesar.periodId, periodId),
      isNull(bukuBesar.deletedAt)
    ))
    .orderBy(asc(bukuBesar.date), asc(bukuBesar.id));

  // Get previous period closing balances as opening balances
  const previousPeriod = await getPreviousPeriod(periodId);
  const previousNeracaSaldo = previousPeriod
    ? await getByPeriod(previousPeriod.id)
    : [];

  // Create map for opening balances from previous period
  const openingBalanceMap = new Map();
  for (const prev of previousNeracaSaldo) {
    openingBalanceMap.set(prev.accountNumber, Number(prev.closingBalance || 0));
  }

  // Aggregate debit/credit from Buku Besar by account
  const accountMap = new Map();

  // Initialize with all accounts from COA
  for (const account of allAccounts) {
    accountMap.set(account.code, {
      accountNumber: account.code,
      accountName: account.name,
      accountLevel: account.level || 4,
      parentAccountNumber: account.parentCode || null,
      normalBalance: account.normalBalance || 'DEBIT',
      openingBalance: openingBalanceMap.get(account.code) || 0,
      debit: 0,
      credit: 0,
    });
  }

  // Aggregate from Buku Besar entries
  for (const entry of bukuBesarEntries) {
    const existing = accountMap.get(entry.accountNumber);
    if (existing) {
      existing.debit += Number(entry.debit || 0);
      existing.credit += Number(entry.credit || 0);
    } else {
      // Account not in COA - create entry from Buku Besar
      accountMap.set(entry.accountNumber, {
        accountNumber: entry.accountNumber,
        accountName: entry.accountName || 'Unknown',
        accountLevel: 4,
        parentAccountNumber: null,
        normalBalance: 'DEBIT',
        openingBalance: openingBalanceMap.get(entry.accountNumber) || 0,
        debit: Number(entry.debit || 0),
        credit: Number(entry.credit || 0),
      });
    }
  }

  // Calculate closing balances
  for (const entry of accountMap.values()) {
    if (entry.normalBalance === 'DEBIT') {
      entry.closingBalance = entry.openingBalance + entry.debit - entry.credit;
    } else {
      entry.closingBalance = entry.openingBalance - entry.debit + entry.credit;
    }
  }

  // Validate: Total Debit should equal Total Credit for period transactions
  const totalDebit = Array.from(accountMap.values()).reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = Array.from(accountMap.values()).reduce((sum, a) => sum + a.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Trial balance does not balance: Total Debit ${totalDebit.toFixed(2)} ≠ Total Credit ${totalCredit.toFixed(2)}`);
  }

  // Upsert to neraca_saldo table
  const neracaSaldoEntries = Array.from(accountMap.values());
  for (const entry of neracaSaldoEntries) {
    await db.insert(neracaSaldo)
      .values({
        periodId,
        accountNumber: entry.accountNumber,
        accountName: entry.accountName,
        accountLevel: entry.accountLevel,
        parentAccountNumber: entry.parentAccountNumber,
        normalBalance: entry.normalBalance,
        openingBalance: String(entry.openingBalance.toFixed(2)),
        debit: String(entry.debit.toFixed(2)),
        credit: String(entry.credit.toFixed(2)),
        closingBalance: String(entry.closingBalance.toFixed(2)),
        description: null,
      })
      .onConflictDoUpdate({
        target: [neracaSaldo.periodId, neracaSaldo.accountNumber],
        set: {
          accountName: entry.accountName,
          accountLevel: entry.accountLevel,
          parentAccountNumber: entry.parentAccountNumber,
          normalBalance: entry.normalBalance,
          openingBalance: String(entry.openingBalance.toFixed(2)),
          debit: String(entry.debit.toFixed(2)),
          credit: String(entry.credit.toFixed(2)),
          closingBalance: String(entry.closingBalance.toFixed(2)),
          updatedAt: new Date(),
        },
      });
  }

  return {
    entries: neracaSaldoEntries,
    totalDebit,
    totalCredit,
    balanced: true,
  };
};
