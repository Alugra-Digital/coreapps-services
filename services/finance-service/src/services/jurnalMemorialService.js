import { db } from '../../../shared/db/index.js';
import { jurnalMemorial, jurnalMemorialLines } from '../../../shared/db/schema.js';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';

const activeRows = () => isNull(jurnalMemorial.deletedAt);

// ── Number generation ────────────────────────────────────────────────────────

export const generateJournalCode = async (year, month) => {
  const prefix = `JM/${year}/${String(month).padStart(2, '0')}/`;
  const rows = await db.select({ journalCode: jurnalMemorial.journalCode })
    .from(jurnalMemorial)
    .where(
      and(
        sql`${jurnalMemorial.journalCode} LIKE ${prefix + '%'}`,
        activeRows()
      )
    )
    .orderBy(asc(jurnalMemorial.journalCode));

  const seq = rows.length > 0
    ? Math.max(...rows.map(r => parseInt(r.journalCode.split('/').pop() ?? '0', 10))) + 1
    : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const validateBalance = (lines) => {
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit ?? 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit ?? 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.001) throw new Error(`Journal is not balanced: debit ${totalDebit} ≠ credit ${totalCredit}`);
};

const withLines = async (journal) => {
  if (!journal) return null;
  const lines = await db.select()
    .from(jurnalMemorialLines)
    .where(eq(jurnalMemorialLines.jurnalMemorialId, journal.id))
    .orderBy(asc(jurnalMemorialLines.id));
  return { ...journal, lines };
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

export const getByPeriod = async (periodId) => {
  const journals = await db.select()
    .from(jurnalMemorial)
    .where(and(eq(jurnalMemorial.periodId, periodId), activeRows()))
    .orderBy(asc(jurnalMemorial.date), asc(jurnalMemorial.id));

  return Promise.all(journals.map(withLines));
};

export const getById = async (id) => {
  const [row] = await db.select()
    .from(jurnalMemorial)
    .where(and(eq(jurnalMemorial.id, id), activeRows()));
  return withLines(row ?? null);
};

export const create = async ({ periodId, date, description, lines, createdBy, year, month }) => {
  if (!lines || lines.length === 0) throw new Error('At least one journal line is required');
  validateBalance(lines);

  const journalCode = await generateJournalCode(year, month);
  const [journal] = await db.insert(jurnalMemorial).values({
    periodId,
    journalCode,
    date,
    description,
    status: 'DRAFT',
    createdBy: createdBy ?? null,
  }).returning();

  const lineValues = lines.map((l) => ({
    jurnalMemorialId: journal.id,
    accountNumber: l.accountNumber,
    accountName: l.accountName,
    debit: String(l.debit ?? 0),
    credit: String(l.credit ?? 0),
    lineDescription: l.lineDescription ?? null,
  }));
  await db.insert(jurnalMemorialLines).values(lineValues);

  return getById(journal.id);
};

export const update = async (id, { date, description, lines }) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Journal not found');
  if (existing.status === 'POSTED') throw new Error('Cannot edit a posted journal');

  if (date || description) {
    await db.update(jurnalMemorial).set({
      date: date ?? existing.date,
      description: description ?? existing.description,
      updatedAt: new Date(),
    }).where(eq(jurnalMemorial.id, id));
  }

  if (lines) {
    validateBalance(lines);
    await db.delete(jurnalMemorialLines).where(eq(jurnalMemorialLines.jurnalMemorialId, id));
    const lineValues = lines.map((l) => ({
      jurnalMemorialId: id,
      accountNumber: l.accountNumber,
      accountName: l.accountName,
      debit: String(l.debit ?? 0),
      credit: String(l.credit ?? 0),
      lineDescription: l.lineDescription ?? null,
    }));
    await db.insert(jurnalMemorialLines).values(lineValues);
  }

  return getById(id);
};

export const post = async (id) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Journal not found');
  if (existing.status === 'POSTED') throw new Error('Journal is already posted');
  validateBalance(existing.lines);

  const [updated] = await db.update(jurnalMemorial)
    .set({ status: 'POSTED', updatedAt: new Date() })
    .where(eq(jurnalMemorial.id, id))
    .returning();
  return withLines(updated);
};

export const remove = async (id) => {
  const existing = await getById(id);
  if (!existing) throw new Error('Journal not found');
  await db.update(jurnalMemorial)
    .set({ deletedAt: new Date() })
    .where(eq(jurnalMemorial.id, id));
};
