import * as productService from '../services/productService.js';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  cost: z.number().min(0),
  unit: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  weight: z.number().optional(),
  imageUrl: z.string().optional(),
});

export const getProducts = async (req, res) => {
  try {
    const products = await productService.getProducts(req.query.search);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found', code: 'NOT_FOUND' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await productService.createProduct(data);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await productService.updateProduct(parseInt(req.params.id), data);
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
