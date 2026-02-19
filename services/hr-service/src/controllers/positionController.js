import { db } from '../../../shared/db/index.js';
import { positions } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';

function toDocSchema(row) {
  if (!row) return null;
  return {
    id: `POS-${row.id}`,
    name: row.name,
    code: row.code ?? null,
    description: row.description ?? null,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
}

function resolvePositionId(idParam) {
  if (!idParam) return null;
  const m = String(idParam).match(/^POS-(\d+)$/);
  return m ? parseInt(m[1], 10) : (isNaN(parseInt(idParam, 10)) ? null : parseInt(idParam, 10));
}

export const getPositions = async (req, res) => {
  try {
    const rows = await db.select().from(positions).orderBy(desc(positions.createdAt));
    res.json(rows.map(toDocSchema));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getPositionById = async (req, res) => {
  try {
    const id = resolvePositionId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Position not found', code: 'NOT_FOUND' });
    const [row] = await db.select().from(positions).where(eq(positions.id, id));
    if (!row) return res.status(404).json({ message: 'Position not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createPosition = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required', code: 'VALIDATION_ERROR', errors: [{ field: 'name', message: 'Name is required' }] });
    const [row] = await db.insert(positions).values({ name, code, description, isActive: isActive ?? true }).returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updatePosition = async (req, res) => {
  try {
    const id = resolvePositionId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Position not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(positions).where(eq(positions.id, id));
    if (!existing) return res.status(404).json({ message: 'Position not found', code: 'NOT_FOUND' });
    const { name, code, description, isActive } = req.body;
    const updates = {};
    if (name != null) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;
    const [row] = await db.update(positions).set({ ...updates, updatedAt: new Date() }).where(eq(positions.id, id)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const deletePosition = async (req, res) => {
  try {
    const id = resolvePositionId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Position not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(positions).where(eq(positions.id, id));
    if (!existing) return res.status(404).json({ message: 'Position not found', code: 'NOT_FOUND' });
    await db.delete(positions).where(eq(positions.id, id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
