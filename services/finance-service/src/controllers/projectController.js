import { db } from '../../../shared/db/index.js';
import { projects } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';

const resolveId = (id) => {
  const s = String(id || '');
  if (s.startsWith('PRJ-')) return parseInt(s.slice(4), 10);
  return parseInt(s, 10);
};

const toDocSchema = (row) => {
  if (!row) return null;
  return {
    id: `PRJ-${row.id}`,
    identity: row.identity ?? {},
    documentRelations: row.documentRelations ?? {},
    finance: row.finance ?? {},
    documents: row.documents ?? [],
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
};

export const getProjects = async (req, res) => {
  try {
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
    res.json(rows.map(toDocSchema));
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
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const createProject = async (req, res) => {
  try {
    const { identity, documentRelations, finance, documents } = req.body;
    if (!identity) {
      return res.status(400).json({ message: 'identity is required', code: 'VALIDATION_ERROR' });
    }
    const fin = finance ?? {};
    const profitLoss = (fin.income ?? 0) - (fin.expense ?? 0);
    const [row] = await db.insert(projects).values({
      identity,
      documentRelations: documentRelations ?? {},
      finance: { ...fin, profitLoss },
      documents: documents ?? [],
    }).returning();
    res.status(201).json(toDocSchema(row));
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
    const { identity, documentRelations, finance, documents } = req.body;
    const updateData = { updatedAt: new Date() };
    if (identity) updateData.identity = identity;
    if (documentRelations) updateData.documentRelations = documentRelations;
    if (finance) {
      const fin = { ...(existing.finance ?? {}), ...finance };
      fin.profitLoss = (fin.income ?? 0) - (fin.expense ?? 0);
      updateData.finance = fin;
    }
    if (documents) updateData.documents = documents;
    const [row] = await db.update(projects).set(updateData).where(eq(projects.id, numId)).returning();
    res.json(toDocSchema(row));
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
