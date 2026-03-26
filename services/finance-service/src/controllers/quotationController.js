import { db } from '../../../shared/db/index.js';
import { quotations, clients, auditLogs } from '../../../shared/db/schema.js';
import { eq, ilike, desc } from 'drizzle-orm';
import { z } from 'zod';
import { generateQuotationPDF } from '../services/pdfService.js';
import { toDocSchema, fromDocSchema } from '../utils/quotationMapper.js';

const itemSchema = z.object({
    description: z.string().min(1),
    qty: z.union([
        z.number().min(1),  // Accept as 'qty'
        z.number().min(1)  // Alias for 'quantity'
    ]),
    price: z.number().min(0),
});

const quotationSchema = z.object({
    clientId: z.number(),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    items: z.array(itemSchema).min(1),
    scopeOfWork: z.string().optional(),
});

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
        console.error('[getQuotations]', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
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
        console.error('[createQuotation]', error);
        res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
    }
};

export const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [quotation] = await db.select({
            quotation: quotations,
            client: clients,
        })
        .from(quotations)
        .leftJoin(clients, eq(quotations.clientId, clients.id))
        .where(eq(quotations.id, Number(id)));
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });
        }
        res.json(toDocSchema(quotation.quotation, quotation.client));
    } catch (error) {
        console.error('[getQuotationById]', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.select().from(quotations).where(eq(quotations.id, Number(id)));
        if (!existing) {
            return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });
        }
        const validatedData = await parseQuotationBody(req.body);
        const { subtotal, ppn, grandTotal } = calculateTotals(validatedData.items);
        const [updated] = await db.update(quotations).set({
            clientId: validatedData.clientId,
            date: validatedData.date,
            items: validatedData.items,
            scopeOfWork: validatedData.scopeOfWork,
            subtotal: subtotal.toString(),
            ppn: ppn.toString(),
            grandTotal: grandTotal.toString(),
            updatedAt: new Date(),
        }).where(eq(quotations.id, Number(id))).returning();
        await logAudit(req, 'UPDATE', updated.id, existing, updated);
        const [client] = await db.select().from(clients).where(eq(clients.id, updated.clientId));
        res.json(toDocSchema(updated, client));
    } catch (error) {
        console.error('[updateQuotation]', error);
        res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
    }
};

export const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.select().from(quotations).where(eq(quotations.id, Number(id)));
        if (!existing) {
            return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });
        }
        await db.delete(quotations).where(eq(quotations.id, Number(id)));
        await logAudit(req, 'DELETE', existing.id, existing, null);
        res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
        console.error('[deleteQuotation]', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const downloadQuotationPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const [quotation] = await db.select({
            quotation: quotations,
            client: clients,
        })
        .from(quotations)
        .leftJoin(clients, eq(quotations.clientId, clients.id))
        .where(eq(quotations.id, Number(id)));
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found', code: 'NOT_FOUND' });
        }
        const pdfBuffer = await generateQuotationPDF(toDocSchema(quotation.quotation, quotation.client));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=quotation-${quotation.quotation.number || id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('[downloadQuotationPDF]', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseQuotationBody = async (body) => {
    return quotationSchema.parse(body);
};

const generateQuotationNumber = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `QUO/${year}/${month}/`;
    const rows = await db.select({ number: quotations.number })
        .from(quotations)
        .where(ilike(quotations.number, `${prefix}%`))
        .orderBy(desc(quotations.number));
    const seq = rows.length > 0
        ? Math.max(...rows.map(r => parseInt(r.number.split('/').pop() ?? '0', 10))) + 1
        : 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
};

const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const ppn = subtotal * 0.11;
    const grandTotal = subtotal + ppn;
    return { subtotal, ppn, grandTotal };
};

const logAudit = async (req, action, entityId, before, after) => {
    try {
        await db.insert(auditLogs).values({
            userId: req.user?.id ?? null,
            action,
            entityType: 'QUOTATION',
            entityId: String(entityId),
            before: before ? JSON.stringify(before) : null,
            after: after ? JSON.stringify(after) : null,
        });
    } catch (err) {
        console.error('[logAudit]', err);
    }
};