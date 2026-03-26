import * as stockService from '../services/stockService.js';
import { z } from 'zod';

const stockEntrySchema = z.object({
  productId: z.number(),
  warehouseId: z.number(),
  // Accept both naming conventions: qtyChange (internal) or quantity (doc-style)
  qtyChange: z.number().optional(),
  quantity: z.number().optional(),
  // Accept both: voucherType (internal) or type (doc-style)
  voucherType: z.string().optional(),
  type: z.string().optional(),
  // Accept both: voucherNo (internal) or reference (doc-style)
  voucherNo: z.string().optional(),
  reference: z.string().optional(),
}).transform((d) => ({
  productId: d.productId,
  warehouseId: d.warehouseId,
  qtyChange: d.qtyChange ?? d.quantity ?? 0,
  voucherType: d.voucherType ?? d.type ?? 'ADJUSTMENT',
  voucherNo: d.voucherNo ?? d.reference ?? `ENTRY-${Date.now()}`,
}));

const warehouseSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  parentWarehouseId: z.number().optional(),
});

export const createStockEntry = async (req, res) => {
  try {
    const data = stockEntrySchema.parse(req.body);
    const entry = await stockService.createStockEntry(data);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const getStockEntries = async (req, res) => {
  try {
    const entries = await stockService.getStockEntries();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getStockBalance = async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    const balance = await stockService.getStockBalance(
      productId ? parseInt(productId) : undefined,
      warehouseId ? parseInt(warehouseId) : undefined
    );
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await stockService.getWarehouses();
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getWarehouseById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid warehouse id', code: 'INVALID_ID' });
    }

    const warehouse = await stockService.getWarehouseById(id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createWarehouse = async (req, res) => {
  try {
    const data = warehouseSchema.parse(req.body);
    const warehouse = await stockService.createWarehouse(data);
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

const warehouseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  parentWarehouseId: z.number().nullable().optional(),
});

export const updateWarehouse = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid warehouse id', code: 'INVALID_ID' });
    }

    const data = warehouseUpdateSchema.parse(req.body);
    const warehouse = await stockService.updateWarehouse(id, data);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    res.json(warehouse);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};
