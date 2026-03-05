import { db } from '../../../shared/db/index.js';
import { projects, projectExpenses } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';

const resolveId = (id) => {
  const s = String(id || '');
  if (s.startsWith('PRJ-')) return parseInt(s.slice(4), 10);
  return parseInt(s, 10);
};

const toDocSchema = (row, expenses = []) => {
  if (!row) return null;
  return {
    id: `PRJ-${row.id}`,
    identity: row.identity ?? {},
    documentRelations: row.documentRelations ?? {},
    finance: row.finance ?? {},
    documents: row.documents ?? [],
    expenses: expenses.map((e) => ({
      expenseId: `EXP-${e.id}`,
      category: e.category ?? '',
      description: e.description ?? '',
      amount: parseFloat(e.amount) || 0,
      date: e.date ?? '',
      status: e.status ?? 'DRAFT',
      phase: e.phase ?? 'ON_GOING',
      clientId: e.clientId ? String(e.clientId) : undefined,
      clientName: undefined,
    })),
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
};

export const getProjects = async (req, res) => {
  try {
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
    // Batch-fetch expenses for all projects
    const projectIds = rows.map((r) => r.id);
    let allExpenses = [];
    if (projectIds.length > 0) {
      allExpenses = await db.select().from(projectExpenses);
    }
    const expensesByProject = {};
    for (const e of allExpenses) {
      if (!expensesByProject[e.projectId]) expensesByProject[e.projectId] = [];
      expensesByProject[e.projectId].push(e);
    }
    res.json(rows.map((r) => toDocSchema(r, expensesByProject[r.id] || [])));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid project ID', code: 'INVALID_ID' });
    const [row] = await db.select().from(projects).where(eq(projects.id, numId));
    if (!row) return res.status(404).json({ message: 'Project not found', code: 'NOT_FOUND' });
    const expenses = await db.select().from(projectExpenses).where(eq(projectExpenses.projectId, numId));
    res.json(toDocSchema(row, expenses));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

/**
 * Sync expenses: delete existing, re-insert new set.
 * Simple replace strategy avoids complex diffing.
 */
async function syncExpenses(projectId, expenses) {
  if (!Array.isArray(expenses)) return;
  // Delete existing expenses for this project
  await db.delete(projectExpenses).where(eq(projectExpenses.projectId, projectId));
  // Insert new expenses
  if (expenses.length > 0) {
    const rows = expenses.map((e) => ({
      projectId,
      category: e.category || e.phase || 'GENERAL',
      description: e.description || '',
      amount: String(e.amount ?? 0),
      date: e.date || new Date().toISOString().slice(0, 10),
      phase: e.phase || 'ON_GOING',
      status: e.status || 'DRAFT',
    }));
    await db.insert(projectExpenses).values(rows);
  }
}

export const createProject = async (req, res) => {
  try {
    const { identity, documentRelations, finance, documents, expenses } = req.body;
    if (!identity) {
      return res.status(400).json({ message: 'identity is required', code: 'VALIDATION_ERROR' });
    }
    const fin = finance ?? {};
    // Compute total expense from expenses array if provided
    const totalExpense = Array.isArray(expenses)
      ? expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
      : (fin.expense ?? 0);
    const [row] = await db.insert(projects).values({
      identity,
      documentRelations: documentRelations ?? {},
      finance: { ...fin, expense: totalExpense, totalExpense },
      documents: documents ?? [],
    }).returning();

    // Sync expenses into relational table
    if (Array.isArray(expenses) && expenses.length > 0) {
      await syncExpenses(row.id, expenses);
    }

    // Re-fetch expenses to return
    const savedExpenses = await db.select().from(projectExpenses).where(eq(projectExpenses.projectId, row.id));
    res.status(201).json(toDocSchema(row, savedExpenses));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid project ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(projects).where(eq(projects.id, numId));
    if (!existing) return res.status(404).json({ message: 'Project not found', code: 'NOT_FOUND' });
    const { identity, documentRelations, finance, documents, expenses } = req.body;
    const updateData = { updatedAt: new Date() };
    if (identity) updateData.identity = identity;
    if (documentRelations) updateData.documentRelations = documentRelations;

    // Compute total expense from expenses array if provided
    const fin = finance ? { ...(existing.finance ?? {}), ...finance } : (existing.finance ?? {});
    if (Array.isArray(expenses)) {
      const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      fin.expense = totalExpense;
      fin.totalExpense = totalExpense;
    }
    updateData.finance = fin;

    if (documents) updateData.documents = documents;
    const [row] = await db.update(projects).set(updateData).where(eq(projects.id, numId)).returning();

    // Sync expenses if provided
    if (Array.isArray(expenses)) {
      await syncExpenses(numId, expenses);
    }

    const savedExpenses = await db.select().from(projectExpenses).where(eq(projectExpenses.projectId, numId));
    res.json(toDocSchema(row, savedExpenses));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid project ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(projects).where(eq(projects.id, numId));
    if (!existing) return res.status(404).json({ message: 'Project not found', code: 'NOT_FOUND' });
    await db.delete(projects).where(eq(projects.id, numId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
