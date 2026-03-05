import { db } from '../../../shared/db/index.js';
import { basts, projectTermins, projects } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { generateBASTPDF } from '../services/pdfService.js';

const resolveId = (id) => {
  const s = String(id || '');
  if (s.startsWith('BAST-')) return parseInt(s.slice(5), 10);
  return parseInt(s, 10);
};

const toDocSchema = (row) => {
  if (!row) return null;
  return {
    id: `BAST-${row.id}`,
    coverInfo: row.coverInfo ?? {},
    documentInfo: row.documentInfo ?? {},
    deliveringParty: row.deliveringParty ?? {},
    receivingParty: row.receivingParty ?? {},
    projectId: row.projectId ?? null,
    status: row.status ?? 'DRAFT',
    linkedInvoiceIds: row.linkedInvoiceIds ?? [],
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
};

export const getBasts = async (req, res) => {
  try {
    const rows = await db.select().from(basts).orderBy(desc(basts.createdAt));
    res.json(rows.map(toDocSchema));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getBastById = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid BAST ID', code: 'INVALID_ID' });
    const [row] = await db.select().from(basts).where(eq(basts.id, numId));
    if (!row) return res.status(404).json({ message: 'BAST not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const createBast = async (req, res) => {
  try {
    const { coverInfo, documentInfo, deliveringParty, receivingParty, projectId, status, linkedInvoiceIds } = req.body;
    if (!coverInfo || !documentInfo || !deliveringParty || !receivingParty) {
      return res.status(400).json({
        message: 'coverInfo, documentInfo, deliveringParty, receivingParty are required',
        code: 'VALIDATION_ERROR',
      });
    }
    const [row] = await db.insert(basts).values({
      coverInfo,
      documentInfo,
      deliveringParty,
      receivingParty,
      projectId: projectId != null ? Number(projectId) : null,
      status: status ?? 'DRAFT',
      linkedInvoiceIds: Array.isArray(linkedInvoiceIds) ? linkedInvoiceIds : [],
    }).returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const updateBast = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid BAST ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(basts).where(eq(basts.id, numId));
    if (!existing) return res.status(404).json({ message: 'BAST not found', code: 'NOT_FOUND' });
    const { coverInfo, documentInfo, deliveringParty, receivingParty, projectId, status, linkedInvoiceIds } = req.body;
    const updateData = { updatedAt: new Date() };
    if (coverInfo) updateData.coverInfo = coverInfo;
    if (documentInfo) updateData.documentInfo = documentInfo;
    if (deliveringParty) updateData.deliveringParty = deliveringParty;
    if (receivingParty) updateData.receivingParty = receivingParty;
    if (projectId !== undefined) updateData.projectId = projectId != null ? Number(projectId) : null;
    if (status !== undefined) updateData.status = status;
    if (linkedInvoiceIds !== undefined) updateData.linkedInvoiceIds = Array.isArray(linkedInvoiceIds) ? linkedInvoiceIds : [];
    const [row] = await db.update(basts).set(updateData).where(eq(basts.id, numId)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const deleteBast = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid BAST ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(basts).where(eq(basts.id, numId));
    if (!existing) return res.status(404).json({ message: 'BAST not found', code: 'NOT_FOUND' });
    await db.delete(basts).where(eq(basts.id, numId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

/** PATCH /basts/:id/sign - Sign BAST, trigger project completion if all termin PAID */
export const signBast = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid BAST ID', code: 'INVALID_ID' });

    const [existing] = await db.select().from(basts).where(eq(basts.id, numId));
    if (!existing) return res.status(404).json({ message: 'BAST not found', code: 'NOT_FOUND' });

    const projectId = existing.projectId;
    if (projectId) {
      const termins = await db.select().from(projectTermins).where(eq(projectTermins.projectId, projectId));
      const notPaid = termins.filter((t) => t.status !== 'PAID');
      if (termins.length > 0 && notPaid.length > 0) {
        return res.status(400).json({
          message: 'Cannot sign BAST: not all project termin are PAID',
          code: 'VALIDATION_ERROR',
          details: { unpaidTermins: notPaid.length },
        });
      }

      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (project) {
        const identity = project.identity ?? {};
        const updatedIdentity = { ...identity, status: 'COMPLETED' };
        await db.update(projects).set({ identity: updatedIdentity, updatedAt: new Date() }).where(eq(projects.id, projectId));
      }
    }

    const [row] = await db.update(basts).set({ status: 'SIGNED', updatedAt: new Date() }).where(eq(basts.id, numId)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    console.error('[signBast]', error);
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const downloadBastPDF = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid BAST ID', code: 'INVALID_ID' });
    const [row] = await db.select().from(basts).where(eq(basts.id, numId));
    if (!row) return res.status(404).json({ message: 'BAST not found', code: 'NOT_FOUND' });
    const pdfBytes = await generateBASTPDF(toDocSchema(row));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="BAST-${row.id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
