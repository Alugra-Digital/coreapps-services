import * as poService from '../services/purchaseOrderService.js';
import { generatePurchaseOrderPDF } from '../services/pdfService.js';
import { toDocSchema, fromDocSchema } from '../utils/purchaseOrderMapper.js';
import { z } from 'zod';

const poSchema = z.object({
  number: z.string().min(1),
  supplierName: z.string().optional(),
  clientId: z.number().optional(),
  projectId: z.number().optional(),
  date: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number().optional(),
  })),
  subtotal: z.number(),
  tax: z.number(),
  grandTotal: z.number(),
  status: z.enum(['DRAFT', 'APPROVED', 'SENT', 'RECEIVED']).optional(),
});

const resolvePoId = (id) => {
  const s = String(id || '');
  if (s.startsWith('PO-')) return parseInt(s.slice(3), 10);
  return parseInt(s, 10);
};

const parsePoBody = (body) => {
  if (body.lineItems && Array.isArray(body.lineItems)) {
    const m = fromDocSchema(body);
    if (!m.number) m.number = null; // Controller will generate
    return m;
  }
  const parsed = poSchema.parse(body);
  const m = {
    number: parsed.number,
    supplierName: parsed.supplierName ?? null,
    clientId: parsed.clientId ?? null,
    projectId: parsed.projectId ?? null,
    date: parsed.date,
    items: parsed.items,
    subtotal: String(parsed.subtotal),
    tax: String(parsed.tax),
    grandTotal: String(parsed.grandTotal),
    status: parsed.status,
  };
  return m;
};

export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await poService.getPurchaseOrders();
    res.json(pos.map(toDocSchema));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    let data = parsePoBody(req.body);
    if (!data.number) {
      data = { ...data, number: await poService.generatePurchaseOrderNumber() };
    }
    if (!data.status) data.status = 'DRAFT';
    const po = await poService.createPurchaseOrder(data);
    res.status(201).json(toDocSchema(po));
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.errors?.map((e) => ({ field: e.path.join('.'), message: e.message })) ?? [],
      });
    }
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const numId = resolvePoId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid PO ID', code: 'INVALID_ID' });
    const po = await poService.getPurchaseOrderById(numId);
    if (!po) return res.status(404).json({ message: 'Purchase Order not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(po));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const numId = resolvePoId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid PO ID', code: 'INVALID_ID' });
    const data = parsePoBody(req.body);
    const po = await poService.updatePurchaseOrder(numId, data);
    if (!po) return res.status(404).json({ message: 'Purchase Order not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(po));
  } catch (error) {
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

export const deletePurchaseOrder = async (req, res) => {
  try {
    const numId = resolvePoId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid PO ID', code: 'INVALID_ID' });
    await poService.deletePurchaseOrder(numId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const downloadPurchaseOrderPDF = async (req, res) => {
  try {
    const numId = resolvePoId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid PO ID', code: 'INVALID_ID' });
    const po = await poService.getPurchaseOrderById(numId);
    if (!po) return res.status(404).json({ message: 'Purchase Order not found', code: 'NOT_FOUND' });
    const pdfBytes = await generatePurchaseOrderPDF(po);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PO-${po.number || po.id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
