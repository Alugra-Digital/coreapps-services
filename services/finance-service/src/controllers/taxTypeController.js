import { db } from '../../../shared/db/index.js';
import { taxTypes } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { generateTaxTypePDF } from '../services/pdfService.js';

const resolveId = (id) => {
  const s = String(id || '');
  if (s.startsWith('TAX-')) return parseInt(s.slice(4), 10);
  return parseInt(s, 10);
};

const toDocSchema = (row) => {
  if (!row) return null;
  return {
    id: `TAX-${row.id}`,
    code: row.code,
    name: row.name,
    rate: parseFloat(row.rate) ?? 0,
    category: row.category,
    description: row.description ?? null,
    regulation: row.regulation ?? null,
    applicableDocuments: row.applicableDocuments ?? [],
    documentUrl: row.documentUrl ?? null,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
};

export const getTaxTypes = async (req, res) => {
  try {
    const rows = await db.select().from(taxTypes).orderBy(desc(taxTypes.createdAt));
    res.json(rows.map(toDocSchema));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getTaxTypeById = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid tax type ID', code: 'INVALID_ID' });
    const [row] = await db.select().from(taxTypes).where(eq(taxTypes.id, numId));
    if (!row) return res.status(404).json({ message: 'Tax type not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const createTaxType = async (req, res) => {
  try {
    const { code, name, rate, category, description, regulation, applicableDocuments, documentUrl, isActive } = req.body;
    if (!code || !name || rate == null || !category) {
      return res.status(400).json({
        message: 'code, name, rate, category are required',
        code: 'VALIDATION_ERROR',
      });
    }
    const [row] = await db.insert(taxTypes).values({
      code,
      name,
      rate: String(rate),
      category,
      description: description ?? null,
      regulation: regulation ?? null,
      applicableDocuments: applicableDocuments ?? [],
      documentUrl: documentUrl ?? null,
      isActive: isActive !== false,
    }).returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Tax code already exists', code: 'CONFLICT' });
    }
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const updateTaxType = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid tax type ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(taxTypes).where(eq(taxTypes.id, numId));
    if (!existing) return res.status(404).json({ message: 'Tax type not found', code: 'NOT_FOUND' });
    const { code, name, rate, category, description, regulation, applicableDocuments, documentUrl, isActive } = req.body;
    const updateData = { updatedAt: new Date() };
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (rate !== undefined) updateData.rate = String(rate);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (regulation !== undefined) updateData.regulation = regulation;
    if (applicableDocuments !== undefined) updateData.applicableDocuments = applicableDocuments;
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    const [row] = await db.update(taxTypes).set(updateData).where(eq(taxTypes.id, numId)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const deleteTaxType = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid tax type ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(taxTypes).where(eq(taxTypes.id, numId));
    if (!existing) return res.status(404).json({ message: 'Tax type not found', code: 'NOT_FOUND' });
    await db.delete(taxTypes).where(eq(taxTypes.id, numId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const downloadTaxTypePDF = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid tax type ID', code: 'INVALID_ID' });
    const [row] = await db.select().from(taxTypes).where(eq(taxTypes.id, numId));
    if (!row) return res.status(404).json({ message: 'Tax type not found', code: 'NOT_FOUND' });
    const doc = toDocSchema(row);
    const pdfBytes = await generateTaxTypePDF(doc);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="TAX-${row.id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
