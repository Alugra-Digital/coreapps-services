import * as productService from '../services/productService.js';
import { z } from 'zod';

const resolveId = (id) => {
  const s = String(id || '');
  if (s.startsWith('INV-')) return parseInt(s.slice(4), 10);
  return parseInt(s, 10);
};

const toDocSchema = (product) => {
  if (!product) return null;
  return {
    id: `INV-${product.id}`,
    code: product.sku ?? '',
    name: product.name ?? '',
    quantity: parseFloat(product.stockQuantity ?? 0),
    price: parseFloat(product.price ?? 0),
    createdAt: product.createdAt?.toISOString?.() ?? null,
    updatedAt: product.updatedAt?.toISOString?.() ?? null,
  };
};

const inventoryItemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().min(0),
  price: z.number().min(0),
});

export const getInventoryItems = async (req, res) => {
  try {
    const products = await productService.getProducts(req.query.search);
    res.json(products.map(toDocSchema));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getInventoryItemById = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid inventory item ID', code: 'INVALID_ID' });
    const product = await productService.getProductById(numId);
    if (!product) return res.status(404).json({ message: 'Inventory item not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(product));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const data = inventoryItemSchema.parse(req.body);
    const product = await productService.createProduct({
      name: data.name,
      sku: data.code,
      price: String(data.price),
      cost: String(data.price),
      stockQuantity: String(data.quantity),
    });
    res.status(201).json(toDocSchema(product));
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.errors?.map((e) => ({ field: e.path.join('.'), message: e.message })) ?? [],
      });
    }
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Code already exists', code: 'CONFLICT' });
    }
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid inventory item ID', code: 'INVALID_ID' });
    const existing = await productService.getProductById(numId);
    if (!existing) return res.status(404).json({ message: 'Inventory item not found', code: 'NOT_FOUND' });
    const data = inventoryItemSchema.partial().parse(req.body);
    const updateData = {};
    if (data.code !== undefined) updateData.sku = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.quantity !== undefined) updateData.stockQuantity = String(data.quantity);
    if (data.price !== undefined) updateData.price = String(data.price);
    const product = await productService.updateProduct(numId, updateData);
    res.json(toDocSchema(product));
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

export const deleteInventoryItem = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid inventory item ID', code: 'INVALID_ID' });
    const existing = await productService.getProductById(numId);
    if (!existing) return res.status(404).json({ message: 'Inventory item not found', code: 'NOT_FOUND' });
    await productService.deleteProduct(numId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
