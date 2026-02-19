import { db } from '../../../shared/db/index.js';
import { vendors } from '../../../shared/db/schema.js';
import { eq, ilike, or, count, desc } from 'drizzle-orm';
import { toDocSchema, fromDocSchema, resolveVendorId } from '../utils/vendorMapper.js';

export const getVendors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const search = (req.query.search || '').trim();
    const hasPagination = !isNaN(page) && !isNaN(limit) && page >= 1 && limit >= 1;

    const whereClause = search
      ? or(
          ilike(vendors.name, `%${search}%`),
          ilike(vendors.companyName, `%${search}%`),
          ilike(vendors.email, `%${search}%`)
        )
      : undefined;

    if (hasPagination) {
      const offset = (page - 1) * limit;
      const [totalRow] = await db.select({ count: count() }).from(vendors).where(whereClause);
      const total = totalRow?.count ?? 0;
      const rows = await db
        .select()
        .from(vendors)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(vendors.createdAt));
      res.json({
        data: rows.map(toDocSchema),
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit) || 1,
      });
    } else {
      const rows = await db.select().from(vendors).where(whereClause).orderBy(desc(vendors.createdAt));
      res.json(rows.map(toDocSchema));
    }
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const id = resolveVendorId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Vendor not found', code: 'NOT_FOUND' });
    const [row] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!row) return res.status(404).json({ message: 'Vendor not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createVendor = async (req, res) => {
  try {
    const { name, companyName } = req.body;
    if (!name || !companyName) {
      return res.status(400).json({
        message: 'Name and companyName are required',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'name', message: 'Required' }],
      });
    }
    const dbData = fromDocSchema(req.body);
    const [row] = await db.insert(vendors).values(dbData).returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const id = resolveVendorId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Vendor not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!existing) return res.status(404).json({ message: 'Vendor not found', code: 'NOT_FOUND' });
    const dbData = fromDocSchema(req.body);
    const [row] = await db.update(vendors).set({ ...dbData, updatedAt: new Date() }).where(eq(vendors.id, id)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const id = resolveVendorId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Vendor not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!existing) return res.status(404).json({ message: 'Vendor not found', code: 'NOT_FOUND' });
    await db.delete(vendors).where(eq(vendors.id, id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
