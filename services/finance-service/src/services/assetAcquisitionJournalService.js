import { db } from '../../../shared/db/index.js';
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
import { eq, and, isNull, asc, sql } from 'drizzle-orm';

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

  const usesTargetAssetAccount = transactionLines.some(line =>
    line.accountNumber === targetAssetAccount || line.accountNumber === relatedAssetAccount
  );

  if (!usesTargetAssetAccount) {
    // Not a 3-part asset journal transaction, return null
    return null;
  }

  // Resolve account IDs
  const [assetAccountId] = await db.select()
    .from(accounts)
    .where(eq(accounts.code, targetAssetAccount))
    .then(rows => rows[0]);

  const [relatedAssetAccountId] = await db.select()
    .from(accounts)
    .where(eq(accounts.code, relatedAssetAccount))
    .then(rows => rows[0]);

  const [bankAccountId] = await db.select()
    .from(accounts)
    .where(eq(accounts.code, bankAccountId))
    .then(rows => rows[0]);

  const [shortTermLiabilityAccountId] = await db.select()
    .from(accounts)
    .where(eq(accounts.code, shortTermLiabilityAccount))
    .then(rows => rows[0]);

  // Generate journal codes for all 3 parts
  const part1JournalCode = await generateJournalCode(period.year, period.month);
  const part2JournalCode = await generateJournalCode(period.year, period.month);
  const part3JournalCode = await generateJournalCode(period.year, period.month);

  // Get sequence numbers (all 3 parts should share sequence in same period)
  const allParts = await db.select({ journalCode: assetAcquisitionJournals.journalCode })
    .from(assetAcquisitionJournals)
    .where(sql`${assetAcquisitionJournals.journalCode} LIKE ${part1JournalCode.slice(0, -1)}%`);

  let baseSeq = allParts.length > 0
    ? Math.max(...allParts.map(r => parseInt(r.journalCode.split('/').pop() ?? '0', 10))) + 1
    : 1;

  const part1Code = `${part1JournalCode}${String(baseSeq).padStart(3, '0')}`;
  const part2Code = `${part2JournalCode}${String(baseSeq + 1).padStart(3, '0')}`;
  const part3Code = `${part3JournalCode}${String(baseSeq + 2).padStart(3, '0')}`;

  // Calculate amounts from Kas Bank transaction
  const totalAmount = transactionLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);

  // Create Part 1: Debet 1240300, Kredit 1250200
  const [part1] = await db.insert(assetAcquisitionJournals).values({
    periodId,
    assetId: kasBankTransaction.assetId, // This links to the asset
    journalCode: part1Code,
    date: kasBankTransaction.date,
    description: `Pengakuanan aset (Part 1) - ${kasBankTransaction.description}`,
    debitAccount: assetAccountId,
    debitAccountName: 'Aset Tetap',
    creditAccount: relatedAssetAccountId,
    creditAccountName: 'Aset Berwujang',
    amount: String(totalAmount),
    notes: `Generated from Kas Bank transaction ${kasBankTransaction.transactionCode}`,
    partType: 'PENGAKUAN_ASET',
    status: 'DRAFT',
    journalEntryId: null, // Will be set when posted
    createdBy: userId ?? null,
  }).returning();

  // Create Part 2: Debet 1250200, Kredit 2110100
  const [part2] = await db.insert(assetAcquisitionJournals).values({
    periodId,
    assetId: kasBankTransaction.assetId,
    journalCode: part2Code,
    date: kasBankTransaction.date,
    description: `Pengakuanan aset (Part 2) - ${kasBankTransaction.description}`,
    debitAccount: relatedAssetAccountId,
    debitAccountName: 'Aset Berwujang',
    creditAccount: shortTermLiabilityAccountId,
    creditAccountName: 'Hutang Jangka Pendek',
    amount: String(totalAmount),
    notes: `Generated from Kas Bank transaction ${kasBankTransaction.transactionCode}`,
    partType: 'PENGAKUAN_HUTANG',
    status: 'DRAFT',
    journalEntryId: null,
    createdBy: userId ?? null,
  }).returning();

  // Create Part 3: Debet 2110100, Kredit 1110201
  const [part3] = await db.insert(assetAcquisitionJournals).values({
    periodId,
    assetId: kasBankTransaction.assetId,
    journalCode: part3Code,
    date: kasBankTransaction.date,
    description: `Pembayaran aset (Part 3) - ${kasBankTransaction.description}`,
    debitAccount: shortTermLiabilityAccountId,
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
    .set({ parentTransactionId: part2.id })
    .where(eq(assetAcquisitionJournals.id, part3.id));

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
  const [journal] = await getById(id);
  if (!journal) return null;

  // Find all parts that have this as their parent
  const [parts] = await db.select()
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
  if (existing.partType !== 'PENGAKUAN_ASET') {
    throw new Error('Only PENGAKUAN_ASET journals can be posted');
  }

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
