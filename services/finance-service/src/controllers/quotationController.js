import { db } from '../../../shared/db/index.js';
import { quotations, clients, auditLogs } from '../../../shared/db/schema.js';
import { eq, ilike, desc } from 'drizzle-orm';
import { z } from 'zod';
import { generateQuotationPDF } from '../services/pdfService.js';
import { toDocSchema, fromDocSchema } from '../utils/quotationMapper.js';

const itemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().min(1),
  price: z.number().min(0),
});

const quotationSchema = z.object({
  clientId: z.number(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  items: z.array(itemSchema).min(1),
  scopeOfWork: z.string().optional(),
});

const generateQuotationNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Format: QT/YYYY/MM/XXX
  const prefix = `QT/${year}/${month}/`;

  const [last] = await db.select({ number: quotations.number })
    .from(quotations)
    .where(ilike(quotations.number, `${prefix}%`))
    .orderBy(desc(quotations.number))
    .limit(1);

  let sequence = 1;
  if (last) {
    const parts = last.number.split('/');
    sequence = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const ppn = subtotal * 0.11;
  const grandTotal = subtotal + ppn;
  return { subtotal, ppn, grandTotal };
};

const logAudit = async (req, actionType, targetId, oldValue, newValue) => {
  await db.insert(auditLogs).values({
    userId: req.user.id,
    actionType,
    targetTable: 'quotations',
    targetId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

export const getQuotations = async (req, res) => {
  try {
    const rows = await db.select({
      quotation: quotations,
      client: clients,
    })
      .from(quotations)
      .leftJoin(clients, eq(quotations.clientId, clients.id))
      .orderBy(desc(quotations.createdAt));

    res.json(rows.map((r) => toDocSchema(r.quotation, r.client)));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

const parseQuotationBody = (body) => {
  if (body.lineItems && Array.isArray(body.lineItems)) {
    return fromDocSchema(body);
  }
  return quotationSchema.parse(body);
};

export const createQuotation = async (req, res) => {
  try {
    const validatedData = await parseQuotationBody(req.body);
    const number = validatedData.number ?? await generateQuotationNumber();
    const { subtotal, ppn, grandTotal } = calculateTotals(validatedData.items);

    const [newQuotation] = await db.insert(quotations).values({
      clientId: validatedData.clientId,
      date: validatedData.date ?? new Date(),
      items: validatedData.items,
      scopeOfWork: validatedData.scopeOfWork,
      number,
      subtotal: subtotal.toString(),
      ppn: ppn.toString(),
      grandTotal: grandTotal.toString(),
    }).returning();

    await logAudit(req, 'CREATE', newQuotation.id, null, newQuotation);

    const [client] = await db.select().from(clients).where(eq(clients.id, newQuotation.clientId));
    res.status(201).json(toDocSchema(newQuotation, client));
  } catch (error) {
    res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
  }
};

export const downloadQuotationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid quotation ID', code: 'INVALID_ID' });
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, numId));
    if (!quotation) return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });

    const [client] = await db.select().from(clients).where(eq(clients.id, quotation.clientId));

    const pdfBytes = await generateQuotationPDF(quotation, client);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${quotation.number}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid quotation ID', code: 'INVALID_ID' });
    const [quotation] = await db.select({
      quotation: quotations,
      clientName: clients.name,
      clientAddress: clients.address,
      clientEmail: clients.email,
    })
      .from(quotations)
      .leftJoin(clients, eq(quotations.clientId, clients.id))
      .where(eq(quotations.id, numId));

    if (!quotation) return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });
    const client = quotation.clientName ? { name: quotation.clientName, address: quotation.clientAddress, email: quotation.clientEmail } : null;
    res.json(toDocSchema(quotation.quotation, client));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid quotation ID', code: 'INVALID_ID' });
    const validatedData = req.body.lineItems
      ? fromDocSchema(req.body)
      : quotationSchema.partial().parse(req.body);

    const [existing] = await db.select().from(quotations).where(eq(quotations.id, numId));
    if (!existing) return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });

    const QUOTATION_FIELDS = ['clientId', 'date', 'items', 'scopeOfWork', 'number', 'status'];
    const updateData = { updatedAt: new Date() };
    for (const k of QUOTATION_FIELDS) {
      if (validatedData[k] !== undefined) updateData[k] = validatedData[k];
    }
    if (validatedData.items) {
      const { subtotal, ppn, grandTotal } = calculateTotals(validatedData.items);
      updateData.subtotal = subtotal.toString();
      updateData.ppn = ppn.toString();
      updateData.grandTotal = grandTotal.toString();
    }

    const [updated] = await db.update(quotations)
      .set(updateData)
      .where(eq(quotations.id, numId))
      .returning();

    await logAudit(req, 'UPDATE', numId, existing, updated);

    const [client] = await db.select().from(clients).where(eq(clients.id, updated.clientId));
    res.json(toDocSchema(updated, client));
  } catch (error) {
    res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid quotation ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(quotations).where(eq(quotations.id, numId));
    if (!existing) return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });

    await db.delete(quotations).where(eq(quotations.id, numId));
    await logAudit(req, 'DELETE', numId, existing, null);

    res.json({ message: 'Quotation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
