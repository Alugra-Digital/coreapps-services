import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '../controllers/inventoryController.js';
import {
  createStockEntry,
  getStockBalance,
  getStockEntries,
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse
} from '../controllers/stockController.js';

const router = express.Router();

// ==================== INVENTORY (doc-compliant: id, code, name, quantity, price) ====================
router.get('/inventory', authenticate, getInventoryItems);
router.get('/inventory/:id', authenticate, getInventoryItemById);
router.post('/inventory', authenticate, createInventoryItem);
router.put('/inventory/:id', authenticate, updateInventoryItem);
router.delete('/inventory/:id', authenticate, deleteInventoryItem);

// ==================== PRODUCTS ====================

/**
 * @openapi
 * /api/inventory/products:
 *   get:
 *     tags: [Inventory]
 *     summary: List all products
 *     description: Retrieve a list of all products in the inventory system with SKU, pricing, and unit information.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   sku:
 *                     type: string
 *                   unit:
 *                     type: string
 *                   sellingPrice:
 *                     type: string
 *                   costPrice:
 *                     type: string
 *   post:
 *     tags: [Inventory]
 *     summary: Create a new product
 *     description: Add a new product to the inventory system with SKU, pricing, and unit details.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sku]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Widget A
 *               sku:
 *                 type: string
 *                 example: WGT-001
 *               unit:
 *                 type: string
 *                 example: pcs
 *               sellingPrice:
 *                 type: string
 *                 example: "50000"
 *               costPrice:
 *                 type: string
 *                 example: "30000"
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
router.get('/products', authenticate, getProducts);
router.get('/products/:id', authenticate, getProductById);
router.post('/products', authenticate, createProduct);
router.put('/products/:id', authenticate, updateProduct);
router.delete('/products/:id', authenticate, deleteProduct);

// ==================== STOCK ====================

/**
 * @openapi
 * /api/inventory/stock/entry:
 *   post:
 *     tags: [Inventory]
 *     summary: Create a stock entry
 *     description: Record a stock receipt, issue, or transfer. Updates the stock balance for the specified product and warehouse.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, warehouseId, quantity, type]
 *             properties:
 *               productId:
 *                 type: integer
 *               warehouseId:
 *                 type: integer
 *               quantity:
 *                 type: number
 *                 example: 100
 *               type:
 *                 type: string
 *                 enum: [RECEIPT, ISSUE, TRANSFER]
 *               reference:
 *                 type: string
 *                 description: Reference number (e.g., PO number, SO number)
 *     responses:
 *       201:
 *         description: Stock entry created
 *       400:
 *         description: Insufficient stock for ISSUE type
 */
router.post('/stock/entry', authenticate, createStockEntry);
router.post('/stock/entries', authenticate, createStockEntry);

/**
 * @openapi
 * /api/inventory/stock/balance:
 *   get:
 *     tags: [Inventory]
 *     summary: Get stock balance
 *     description: Get current stock balance for all products across all warehouses.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock balance report showing quantity per product per warehouse
 */
router.get('/stock/balance', authenticate, getStockBalance);
router.get('/stock/entries', authenticate, getStockEntries);

// ==================== WAREHOUSES ====================

/**
 * @openapi
 * /api/inventory/warehouses:
 *   get:
 *     tags: [Inventory]
 *     summary: List all warehouses
 *     description: Retrieve a list of all warehouse locations.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouses
 *   post:
 *     tags: [Inventory]
 *     summary: Create a new warehouse
 *     description: Register a new warehouse location in the system.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Warehouse Jakarta
 *               location:
 *                 type: string
 *                 example: Jakarta Utara
 *     responses:
 *       201:
 *         description: Warehouse created
 */
router.get('/warehouses', authenticate, getWarehouses);
router.get('/warehouses/:id', authenticate, getWarehouseById);
router.post('/warehouses', authenticate, createWarehouse);
router.put('/warehouses/:id', authenticate, updateWarehouse);

export default router;
