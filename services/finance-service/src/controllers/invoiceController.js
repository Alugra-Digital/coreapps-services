import { db } from '../../../shared/db/index.js';
import { invoices, clients, auditLogs, quotations } from '../../../shared/db/schema.js';
import { eq, ilike, desc, or } from 'drizzle-orm';
import { z } from 'zod';
import { generateInvoicePDF } from '../services/pdfService.js';
import { autoPostInvoice } from '../services/accountingService.js';
import * as paymentService from '../services/paymentService.js';
import { toDocSchema, fromDocSchema } from '../utils/invoiceMapper.js';

const itemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().min(1),
  price: z.number().min(0),
});

const invoiceSchema = z.object({
  clientId: z.number(),
  quotationId: z.number().optional(),
  projectId: z.number().optional().nullable(),
  terminId: z.number().optional().nullable(),
  clientPurchaseOrderId: z.number().optional().nullable(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  dueDate: z.string().optional().transform((val) => (val === "" ? undefined : val ? new Date(val) : undefined)),
  items: z.array(itemSchema).min(1),
  pph: z.number().min(0).default(0),
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIAL', 'PAID']).default('DRAFT'),
});

const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Format: INV/YYYY/MM/XXX
  const prefix = `INV/${year}/${month}/`;

  const [last] = await db.select({ number: invoices.number })
    .from(invoices)
    .where(ilike(invoices.number, `${prefix}%`))
    .orderBy(desc(invoices.number))
    .limit(1);

  let sequence = 1;
  if (last) {
    const parts = last.number.split('/');
    sequence = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

const calculateTotals = (items, pphRate = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const ppn = subtotal * 0.11;
  const pph = pphRate; // Assuming pph is passed as a value, not rate. Wait, schema says decimal.
  // If pph is a value, we just subtract it or add it? Usually PPh 23 is deducted.
  // Let's assume PPh is a deduction from the payment but part of the tax calculation.
  // Standard: Grand Total = Subtotal + PPN - PPh (if PPh is withheld by client)
  // Or Grand Total = Subtotal + PPN.
  // Let's stick to the schema which has `grandTotal`.
  // Usually Invoice Grand Total is what needs to be paid.
  // Let's assume Grand Total = Subtotal + PPN. PPh is usually calculated for tax reporting.
  // However, if we want to show PPh on invoice, it might be a deduction.
  // Let's keep it simple: Grand Total = Subtotal + PPN. PPh is stored for reference.

  // Wait, if I look at `quotationController.js`, it does `grandTotal = subtotal + ppn`.
  // Let's do the same here. `pph` will be just stored.

  const grandTotal = subtotal + ppn;
  return { subtotal, ppn, grandTotal };
};

const resolveInvoiceId = (id) => {
  if (typeof id === 'number' && !isNaN(id)) return id;
  const s = String(id || '');
  if (s.startsWith('INV-')) return parseInt(s.slice(4), 10);
  return parseInt(s, 10);
};

const logAudit = async (req, actionType, targetId, oldValue, newValue) => {
  await db.insert(auditLogs).values({
    userId: req.user?.id,
    actionType,
    targetTable: 'invoices',
    targetId,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

export const getInvoices = async (req, res) => {
  try {
    const rows = await db.select({
      invoice: invoices,
      clientName: clients.name,
      quotationNumber: quotations.number,
    })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
      .orderBy(desc(invoices.createdAt));

    const data = rows.map((r) => toDocSchema(r.invoice, { name: r.clientName, address: null }));
    res.json(data);
  } catch (error) {
    console.error('[getInvoices]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const numId = resolveInvoiceId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid invoice ID', code: 'INVALID_ID' });

    const [row] = await db.select({
      invoice: invoices,
      client: clients,
    })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, numId));

    if (!row) return res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' });

    const data = toDocSchema(row.invoice, row.client);
  } catch (error) {
    console.error('[getInvoiceById]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

const parseInvoiceBody = async (body) => {
  if (body.lineItems && Array.isArray(body.lineItems)) {
    const mapped = fromDocSchema(body);
    let clientId = body.clientId != null ? Number(body.clientId) : null;
    if (!clientId && body.billingInfo?.companyName) {
      const [c] = await db.select().from(clients)
        .where(or(
          eq(clients.companyName, body.billingInfo.companyName),
          eq(clients.name, body.billingInfo.companyName)
        ))
        .limit(1);
      clientId = c?.id ?? null;
    }
    if (!clientId) throw new Error('clientId or billingInfo.companyName (to resolve client) is required');
    return {
      clientId,
      quotationId: body.quotationId != null ? Number(body.quotationId) : undefined,
      projectId: body.projectId != null ? Number(body.projectId) : undefined,
      terminId: body.terminId != null ? Number(body.terminId) : undefined,
      clientPurchaseOrderId: body.clientPurchaseOrderId != null ? Number(body.clientPurchaseOrderId) : undefined,
      date: mapped.date ?? new Date(),
      dueDate: mapped.dueDate,
      items: mapped.items,
      pph: parseFloat(mapped.pph) || 0,
      status: mapped.status ?? 'DRAFT',
    };
  }
  return invoiceSchema.parse(body);
};

export const createInvoice = async (req, res) => {
  try {
    const validatedData = await parseInvoiceBody(req.body);
    const number = req.body.invoiceInfo?.invoiceNumber ?? await generateInvoiceNumber();
    const { subtotal, ppn, grandTotal } = calculateTotals(validatedData.items);

    const insertData = {
      clientId: validatedData.clientId,
      quotationId: validatedData.quotationId,
      projectId: validatedData.projectId ?? null,
      terminId: validatedData.terminId ?? null,
      clientPurchaseOrderId: validatedData.clientPurchaseOrderId ?? null,
      date: validatedData.date,
      dueDate: validatedData.dueDate,
      items: validatedData.items,
      pph: validatedData.pph.toString(),
      number,
      subtotal: subtotal.toString(),
      ppn: ppn.toString(),
      grandTotal: grandTotal.toString(),
      status: validatedData.status,
    };
    const [newInvoice] = await db.insert(invoices).values(insertData).returning();

    await logAudit(req, 'CREATE', newInvoice.id, null, newInvoice);

    const [clientRow] = await db.select().from(clients).where(eq(clients.id, newInvoice.clientId));
    res.status(201).json(toDocSchema(newInvoice, clientRow ?? null));
  } catch (error) {
    console.error('[createInvoice]', error);
    res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
  }
};

export const downloadInvoicePDF = async (req, res) => {
  try {
    const numId = resolveInvoiceId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid invoice ID', code: 'INVALID_ID' });

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, numId));
    if (!invoice) return res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' });

    const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId));

    const pdfBytes = await generateInvoicePDF(invoice, client);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.number}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('[downloadInvoicePDF]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const numId = resolveInvoiceId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid invoice ID', code: 'INVALID_ID' });

    const [existing] = await db.select().from(invoices).where(eq(invoices.id, numId));
    if (!existing) return res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' });

    await db.delete(invoices).where(eq(invoices.id, numId));
    await logAudit(req, 'DELETE', numId, existing, null);

    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error('[deleteInvoice]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const numId = resolveInvoiceId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid invoice ID', code: 'INVALID_ID' });

    const [existing] = await db.select().from(invoices).where(eq(invoices.id, numId));
    if (!existing) return res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' });

    const validatedData = await parseInvoiceBody(req.body);
    const { subtotal, ppn, grandTotal } = calculateTotals(validatedData.items);

    const [updated] = await db.update(invoices)
      .set({
        clientId: validatedData.clientId,
        quotationId: validatedData.quotationId ?? existing.quotationId,
        projectId: validatedData.projectId ?? existing.projectId ?? null,
        terminId: validatedData.terminId ?? existing.terminId ?? null,
        clientPurchaseOrderId: validatedData.clientPurchaseOrderId ?? existing.clientPurchaseOrderId ?? null,
        date: validatedData.date,
        dueDate: validatedData.dueDate ?? existing.dueDate,
        items: validatedData.items,
        pph: validatedData.pph.toString(),
        subtotal: subtotal.toString(),
        ppn: ppn.toString(),
        grandTotal: grandTotal.toString(),
        status: validatedData.status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, numId))
      .returning();

    await logAudit(req, 'UPDATE', numId, existing, updated);
    const [client] = await db.select().from(clients).where(eq(clients.id, updated.clientId));
    res.json(toDocSchema(updated, client));
  } catch (error) {
    console.error('[updateInvoice]', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.errors?.map((e) => ({ field: e.path.join('.'), message: e.message })) ?? [],
      });
    }
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const numId = resolveInvoiceId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid invoice ID', code: 'INVALID_ID' });

    const [existing] = await db.select().from(invoices).where(eq(invoices.id, numId));
    if (!existing) return res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' });

    const [updated] = await db.update(invoices)
      .set({ status: req.body.status, updatedAt: new Date() })
      .where(eq(invoices.id, numId))
      .returning();

    await logAudit(req, 'UPDATE_STATUS', numId, { status: existing.status }, { status: updated.status });

    // Trigger Auto-Posting if moving to ISSUED
    if (req.body.status === 'ISSUED' && !existing.journalEntryId) {
      await autoPostInvoice(numId);
    }

    const [client] = await db.select().from(clients).where(eq(clients.id, updated.clientId));
    res.json(toDocSchema(updated, client));
  } catch (error) {
    console.error('[updateInvoiceStatus]', error);
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

/** POST /invoices/:id/payments - Record payment against invoice (CoreApps 2.0) */
export const recordInvoicePayment = async (req, res) => {
  try {
    const numId = resolveInvoiceId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid invoice ID', code: 'INVALID_ID' });

    const { amount, paymentMode, referenceNo, date } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'amount is required and must be positive', code: 'VALIDATION_ERROR' });
    }
    const mode = (paymentMode || 'BANK').toUpperCase();
    if (mode !== 'CASH' && mode !== 'BANK') {
      return res.status(400).json({ message: 'paymentMode must be CASH or BANK', code: 'VALIDATION_ERROR' });
    }

    const payment = await paymentService.createPayment({
      invoiceId: numId,
      amount: Number(amount),
      paymentMode: mode,
      referenceNo: referenceNo?.trim() || null,
      date: date || new Date().toISOString(),
    });

    const payments = await paymentService.getPaymentsByInvoice(numId);
    res.status(201).json({
      payment: {
        id: payment.id,
        invoiceId: numId,
        amount: parseFloat(payment.amount || 0),
        paymentMode: payment.paymentMode,
        referenceNo: payment.referenceNo,
        date: payment.date,
      },
      payments: payments.map((p) => ({
        id: p.id,
        amount: parseFloat(p.amount || 0),
        paymentMode: p.paymentMode,
        referenceNo: p.referenceNo,
        date: p.date,
      })),
    });
  } catch (error) {
    console.error('[recordInvoicePayment]', error);
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};
