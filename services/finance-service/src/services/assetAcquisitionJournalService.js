import { db, pool } from '../../../shared/db/index.js';
import {
  assetAcquisitionJournals,
  assets,
  journalEntries,
  journalEntryLines,
  accounts,
  accountingPeriods,
  kasBankTransactions,
  kasBankTransactionLines,
} from '../../../shared/db/schema.js';
import { eq, and, isNull, asc, sql, inArray } from 'drizzle-orm';
import * as bukuBesarService from './bukuBesarService.js';

const activeRows = () => isNull(assetAcquisitionJournals.deletedAt);

// ── Number generation ──────────────────────────────────────────────────────

export const generateJournalCode = async (year, month) => {
  const prefix = `JAA/${year}/${String(month).padStart(2, '0')}/`;
  const rows = await db.select({ journalCode: assetAcquisitionJournals.journalCode })
    .from(assetAcquisitionJournals)
    .where(sql`${assetAcquisitionJournals.journalCode} LIKE ${prefix + '%'}`)
    .orderBy(asc(assetAcquisitionJournals.journalCode));

  const seq = rows.length > 0
    ? Math.max(...rows.map(r => parseInt(r.journalCode.split('/').pop() ?? '0', 10))) + 1
    : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

// ── 3-Part Journal Generation ───────────────────────────────────────────────────────

/**
 * Generate 3-part Jurnal Memori Aset from a Kas Bank transaction
 * This happens when a Kas Bank transaction uses account 1240300 (Aset Tetap)
 *
 * Part 1: Debet 1240300 (Aset Tetap), Kredit 1250200 (Aset Berwujang)
 * Part 2: Debet 1250200 (Aset Berwujang), Kredit 2110100 (Hutang Jangka Pendek)
 * Part 3: Debet 2110100 (Hutang Jangka Pendek), Kredit 1110201 (Kas Bank)
 */
export const generate3PartAssetJournal = async (kasBankTransactionId, periodId, userId) => {
  // Get the Kas Bank transaction
  const [kasBankTransaction] = await db.select()
    .from(kasBankTransactions)
    .where(eq(kasBankTransactions.id, kasBankTransactionId));

  if (!kasBankTransaction) {
    throw new Error('Kas Bank transaction not found');
  }

  const period = await db.select()
    .from(accountingPeriods)
    .where(eq(accountingPeriods.id, periodId))
    .then(rows => rows[0]);

  if (!period) {
    throw new Error('Period not found');
  }

  if (period.status !== 'OPEN') {
    throw new Error('Cannot create journals in a non-open period');
  }

  // Check if account 1240300 or equivalent is used
  const bankAccountId = '1110201'; // Kas Bank account
  const targetAssetAccount = '1240300'; // Aset Tetap
  const relatedAssetAccount = '1250200'; // Aset Berwujang
  const shortTermLiabilityAccount = '2110100'; // Hutang Jangka Pendek

  // Check if any line uses the target asset account
  const transactionLines = await db.select()
    .from(kasBankTransactionLines)
    .where(eq(kasBankTransactionLines.kasBankTransactionId, kasBankTransactionId));

  const mainCoaIsAsset = kasBankTransaction.coaAccount === targetAssetAccount;
  const linesHaveAsset = transactionLines.some(line =>
    line.accountNumber === targetAssetAccount || line.accountNumber === relatedAssetAccount
  );

  if (!mainCoaIsAsset && !linesHaveAsset) {
    // Not a 3-part asset journal transaction, return null
    return null;
  }

  // Calculate amounts from Kas Bank transaction
  // When triggered by main coaAccount (no lines), amount = outflow
  const totalAmount = transactionLines.length > 0
    ? transactionLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    : (Number(kasBankTransaction.outflow) || 0);

  // Acquire advisory lock to prevent concurrent code collisions for this period
  const lockKey = periodId; // integer period ID used as lock key
  await pool.query(`SELECT pg_advisory_lock($1)`, [lockKey]);

  let part1, part2, part3;
  try {
    // Generate 3 unique sequential codes: call once, increment for parts 2+3
    const prefix = `JAA/${period.year}/${String(period.month).padStart(2, '0')}/`;
    const baseCode = await generateJournalCode(period.year, period.month);
    const baseSeq = parseInt(baseCode.replace(prefix, ''), 10);
    const part1Code = baseCode; // same value, avoid re-serializing
    const part2Code = `${prefix}${String(baseSeq + 1).padStart(3, '0')}`;
    const part3Code = `${prefix}${String(baseSeq + 2).padStart(3, '0')}`;

    // Create Part 1: Debet 1240300, Kredit 1250200
    [part1] = await db.insert(assetAcquisitionJournals).values({
      periodId,
      assetId: null,
      journalCode: part1Code,
      date: kasBankTransaction.date,
      description: `Pengakuanan aset (Part 1) - ${kasBankTransaction.description}`,
      debitAccount: targetAssetAccount,
      debitAccountName: 'Aset Tetap',
      creditAccount: relatedAssetAccount,
      creditAccountName: 'Aset Berwujang',
      amount: String(totalAmount),
      notes: `Generated from Kas Bank transaction ${kasBankTransaction.transactionCode}`,
      partType: 'PENGAKUAN_ASET',
      status: 'DRAFT',
      journalEntryId: null, // Will be set when posted
      createdBy: userId ?? null,
    }).returning();

    // Create Part 2: Debet 1250200, Kredit 2110100
    [part2] = await db.insert(assetAcquisitionJournals).values({
      periodId,
      assetId: null,
      journalCode: part2Code,
      date: kasBankTransaction.date,
      description: `Pengakuanan aset (Part 2) - ${kasBankTransaction.description}`,
      debitAccount: relatedAssetAccount,
      debitAccountName: 'Aset Berwujang',
      creditAccount: shortTermLiabilityAccount,
      creditAccountName: 'Hutang Jangka Pendek',
      amount: String(totalAmount),
      notes: `Generated from Kas Bank transaction ${kasBankTransaction.transactionCode}`,
      partType: 'PENGAKUAN_HUTANG_ASET',
      status: 'DRAFT',
      journalEntryId: null,
      createdBy: userId ?? null,
    }).returning();

    // Create Part 3: Debet 2110100, Kredit 1110201
    [part3] = await db.insert(assetAcquisitionJournals).values({
      periodId,
      assetId: null,
      journalCode: part3Code,
      date: kasBankTransaction.date,
      description: `Pembayaran aset (Part 3) - ${kasBankTransaction.description}`,
      debitAccount: shortTermLiabilityAccount,
      debitAccountName: 'Hutang Jangka Pendek',
      creditAccount: bankAccountId,
      creditAccountName: 'Kas Bank',
      amount: String(totalAmount),
      notes: `Generated from Kas Bank transaction ${kasBankTransaction.transactionCode}`,
      partType: 'PEMBAYARAN_ASET',
      status: 'DRAFT',
      journalEntryId: null,
      createdBy: userId ?? null,
    }).returning();

    // Link all 3 parts together via parentTransactionId
    await db.update(assetAcquisitionJournals)
      .set({ parentTransactionId: part1.id })
      .where(eq(assetAcquisitionJournals.id, part2.id));

    await db.update(assetAcquisitionJournals)
      .set({ parentTransactionId: part1.id })
      .where(eq(assetAcquisitionJournals.id, part3.id));
  } finally {
    await pool.query(`SELECT pg_advisory_unlock($1)`, [lockKey]);
  }

  // Auto-post all 3 parts to Buku Besar; only mark POSTED if succeeded
  const postedIds = [];
  for (const part of [part1, part2, part3]) {
    try {
      await bukuBesarService.postFromAssetJournal(part);
      postedIds.push(part.id);
    } catch (postErr) {
      console.error(`Failed to post asset journal ${part.journalCode} to Buku Besar:`, postErr.message);
    }
  }

  if (postedIds.length !== 3) {
    throw new Error(
      `Asset journal partially posted: ${postedIds.length}/3 parts posted to Buku Besar. ` +
      `Part IDs attempted: ${[part1.id, part2.id, part3.id].join(', ')}, ` +
      `Posted: ${postedIds.join(', ')}`
    );
  }

  // All 3 succeeded — now mark as POSTED
  await db.update(assetAcquisitionJournals)
    .set({ status: 'POSTED', updatedAt: new Date() })
    .where(inArray(assetAcquisitionJournals.id, [part1.id, part2.id, part3.id]));

  // Return the first part for reference
  return getById(part1.id);
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const getByPeriod = async (periodId) => {
  const rows = await db.select({
    journal: assetAcquisitionJournals,
    assetName: assets.name,
    assetCode: assets.assetCode,
  })
    .from(assetAcquisitionJournals)
    .leftJoin(assets, eq(assetAcquisitionJournals.assetId, assets.id))
    .where(and(
      eq(assetAcquisitionJournals.periodId, periodId),
      activeRows()
    ))
    .orderBy(asc(assetAcquisitionJournals.date), asc(assetAcquisitionJournals.id));

  return rows.map(r => ({ ...r.journal, assetName: r.assetName, assetCode: r.assetCode }));
};

export const getById = async (id) => {
  const [row] = await db.select({
    journal: assetAcquisitionJournals,
    assetName: assets.name,
    assetCode: assets.assetCode,
  })
    .from(assetAcquisitionJournals)
    .leftJoin(assets, eq(assetAcquisitionJournals.assetId, assets.id))
    .where(and(eq(assetAcquisitionJournals.id, id), activeRows()));
  if (!row) return null;
  return { ...row.journal, assetName: row.assetName, assetCode: row.assetCode };
};

export const create = async ({
  periodId, assetId, date, description,
  debitAccount, debitAccountName, creditAccount, creditAccountName,
  amount, notes, createdBy,
}) => {
  const [period] = await db.select().from(accountingPeriods).where(eq(accountingPeriods.id, periodId));
  if (!period) throw new Error('Accounting period not found');
  if (period.status !== 'OPEN') throw new Error('Cannot create journals in a non-open period');

  const journalCode = await generateJournalCode(period.year, period.month);

  const [journal] = await db.insert(assetAcquisitionJournals).values({
    periodId,
    assetId,
    journalCode,
    date,
    description,
    debitAccount,
    debitAccountName,
    creditAccount,
    creditAccountName,
    amount: String(amount),
    notes: notes ?? null,
    status: 'DRAFT',
    journalEntryId: null,
    createdBy: createdBy ?? null,
  }).returning();

  return getById(journal.id);
};

export const update = async (id, data) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Journal not found');
  if (existing.status !== 'DRAFT') throw new Error('Only DRAFT journals can be updated');

  const [updated] = await db.update(assetAcquisitionJournals)
    .set({ ...data, amount: data.amount != null ? String(data.amount) : undefined, updatedAt: new Date() })
    .where(eq(assetAcquisitionJournals.id, id))
    .returning();
  return getById(updated.id);
};

// ── Helper to get journal with all linked parts ────────────────────────────────

export const getJournalWithParts = async (id) => {
  const journal = await getById(id);
  if (!journal) return null;

  // Find all parts that have this as their parent
  const parts = await db.select()
    .from(assetAcquisitionJournals)
    .where(eq(assetAcquisitionJournals.parentTransactionId, id))
    .orderBy(asc(assetAcquisitionJournals.id));

  return { ...journal, parts };
};

// ── Post (Legacy - for auto-posting) ──────────────────────────────────────

export const post = async (id) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Journal not found');
  if (existing.status !== 'DRAFT') throw new Error('Journal is already posted');
  // Allow posting of any manually-created or auto-generated journal

  // Resolve account IDs
  const resolveAccountId = async (code, name) => {
    const [acc] = await db.select().from(accounts).where(eq(accounts.code, code));
    if (acc) return acc.id;
    // Auto-create account if it doesn't exist yet
    const [newAcc] = await db.insert(accounts).values({
      code,
      name,
      type: 'ASSET',
    }).returning();
    return newAcc.id;
  };

  const debitAccountId = await resolveAccountId(existing.debitAccount, existing.debitAccountName);
  const creditAccountId = await resolveAccountId(existing.creditAccount, existing.creditAccountName);

  // Create journal_entry
  const [je] = await db.insert(journalEntries).values({
    date: new Date(existing.date),
    description: existing.description,
    reference: existing.journalCode,
    status: 'POSTED',
    totalDebit: String(existing.amount),
    totalCredit: String(existing.amount),
    postedAt: new Date(),
  }).returning();

  // Create journal_entry_lines (2 lines)
  await db.insert(journalEntryLines).values([
    {
      journalEntryId: je.id,
      accountId: debitAccountId,
      debit: String(existing.amount),
      credit: '0',
      description: `${existing.debitAccountName} (${existing.debitAccount})`,
      reference: existing.journalCode,
    },
    {
      journalEntryId: je.id,
      accountId: creditAccountId,
      debit: '0',
      credit: String(existing.amount),
      description: `${existing.creditAccountName} (${existing.creditAccount})`,
      reference: existing.journalCode,
    },
  ]);

  // Update the journal to POSTED status and link to journal_entry
  const [updated] = await db.update(assetAcquisitionJournals)
    .set({ status: 'POSTED', journalEntryId: je.id, updatedAt: new Date() })
    .where(eq(assetAcquisitionJournals.id, id))
    .returning();
  return getById(updated.id);
};

export const remove = async (id) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Journal not found');
  if (existing.status !== 'DRAFT') throw new Error('Only DRAFT journals can be deleted');
  if (existing.status === 'POSTED') throw new Error('Cannot delete posted journals');

  await db.update(assetAcquisitionJournals)
    .set({ deletedAt: new Date() })
    .where(eq(assetAcquisitionJournals.id, id));
};
