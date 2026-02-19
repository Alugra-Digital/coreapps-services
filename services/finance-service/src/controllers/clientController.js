import { db } from '../../../shared/db/index.js';
import { clients } from '../../../shared/db/schema.js';
import { eq, ilike, or, and, count, desc } from 'drizzle-orm';
import { toDocSchema, fromDocSchema, resolveClientId } from '../utils/clientMapper.js';

export const getClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const search = (req.query.search || '').trim();
    const hasPagination = !isNaN(page) && !isNaN(limit) && page >= 1 && limit >= 1;

    const whereClause = search
      ? or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.companyName, `%${search}%`),
          ilike(clients.email, `%${search}%`)
        )
      : undefined;

    if (hasPagination) {
      const offset = (page - 1) * limit;
      const [totalRow] = await db.select({ count: count() }).from(clients).where(whereClause);
      const total = totalRow?.count ?? 0;
      const rows = await db
        .select()
        .from(clients)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(clients.createdAt));
      res.json({
        data: rows.map(toDocSchema),
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit) || 1,
      });
    } else {
      const rows = await db.select().from(clients).where(whereClause).orderBy(desc(clients.createdAt));
      res.json(rows.map(toDocSchema));
    }
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getClientById = async (req, res) => {
  try {
    const id = resolveClientId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    const [row] = await db.select().from(clients).where(eq(clients.id, id));
    if (!row) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createClient = async (req, res) => {
  try {
    const { name, companyName } = req.body;
    if (!name) {
      return res.status(400).json({
        message: 'Name is required',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'name', message: 'Name is required' }],
      });
    }
    const dbData = fromDocSchema(req.body);
    dbData.name = name;
    dbData.companyName = companyName ?? name;
    const [row] = await db.insert(clients).values(dbData).returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateClient = async (req, res) => {
  try {
    const id = resolveClientId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(clients).where(eq(clients.id, id));
    if (!existing) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    const dbData = fromDocSchema(req.body);
    const [row] = await db.update(clients).set({ ...dbData, updatedAt: new Date() }).where(eq(clients.id, id)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const id = resolveClientId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(clients).where(eq(clients.id, id));
    if (!existing) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    await db.delete(clients).where(eq(clients.id, id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
