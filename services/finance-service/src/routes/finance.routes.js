import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  downloadQuotationPDF
} from '../controllers/quotationController.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  downloadInvoicePDF,
  deleteInvoice,
  updateInvoiceStatus
} from '../controllers/invoiceController.js';
import {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsByInvoice
} from '../controllers/paymentController.js';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  downloadPurchaseOrderPDF
} from '../controllers/purchaseOrderController.js';
import {
  getExpenses,
  createExpense,
  updateExpenseStatus,
  postExpense,
} from '../controllers/expenseController.js';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../controllers/vendorController.js';
import {
  lockInvoicePDF,
  createInvoiceRevision,
} from '../controllers/pdfLockController.js';
import {
  getBasts,
  getBastById,
  createBast,
  updateBast,
  deleteBast,
  downloadBastPDF,
} from '../controllers/bastController.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import {
  getTaxTypes,
  getTaxTypeById,
  createTaxType,
  updateTaxType,
  deleteTaxType,
  downloadTaxTypePDF,
} from '../controllers/taxTypeController.js';
import {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  downloadProposalPDF,
} from '../controllers/proposalPenawaranController.js';

const router = express.Router();

// ==================== CLIENTS ====================

/**
 * @openapi
 * /api/finance/clients:
 *   get:
 *     tags: [Finance]
 *     summary: List all clients
 *     description: Retrieve a list of all clients/customers. Requires FINANCE_ADMIN or SUPER_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Finance]
 *     summary: Create a new client
 *     description: Register a new client in the finance system.
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
 *                 example: PT ABC Indonesia
 *               email:
 *                 type: string
 *                 example: finance@abc.co.id
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               npwp:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created successfully
 */
router.get('/clients', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getClients);
router.get('/clients/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getClientById);
router.post('/clients', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createClient);
router.put('/clients/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateClient);
router.patch('/clients/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateClient);
router.delete('/clients/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteClient);

// ==================== QUOTATIONS ====================

/**
 * @openapi
 * /api/finance/quotations:
 *   get:
 *     tags: [Finance]
 *     summary: List all quotations
 *     description: Retrieve all quotations with client details and line items.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quotations
 *   post:
 *     tags: [Finance]
 *     summary: Create a new quotation
 *     description: Create a quotation for a client. Quotations can later be converted to invoices.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, items]
 *             properties:
 *               clientId:
 *                 type: integer
 *               validUntil:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Quotation created
 */
router.get('/quotations', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getQuotations);
router.post('/quotations', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createQuotation);
router.get('/quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getQuotationById);
router.put('/quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateQuotation);
router.patch('/quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateQuotation);
router.delete('/quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteQuotation);
router.get('/quotations/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadQuotationPDF);

// ==================== INVOICES ====================

/**
 * @openapi
 * /api/finance/invoices:
 *   get:
 *     tags: [Finance]
 *     summary: List all invoices
 *     description: Retrieve all invoices with status, amounts, and client details.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 *   post:
 *     tags: [Finance]
 *     summary: Create a new invoice
 *     description: Create an invoice for a client. Auto-generates invoice number. Optionally creates journal entry in accounting.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Invoice'
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 */
router.get('/invoices', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getInvoices);
router.get('/invoices/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getInvoiceById);
router.post('/invoices', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createInvoice);
router.put('/invoices/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateInvoice);
router.patch('/invoices/:id/status', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateInvoiceStatus);
router.get('/invoices/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadInvoicePDF);
router.delete('/invoices/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteInvoice);

// ==================== PAYMENTS ====================

/**
 * @openapi
 * /api/finance/payments:
 *   post:
 *     tags: [Finance]
 *     summary: Record a payment
 *     description: Record a payment against an invoice. Updates invoice status to PAID when fully settled.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, amount]
 *             properties:
 *               invoiceId:
 *                 type: integer
 *               amount:
 *                 type: number
 *                 example: 15000000
 *               paymentMethod:
 *                 type: string
 *                 enum: [BANK_TRANSFER, CASH, CREDIT_CARD, E_WALLET]
 *               reference:
 *                 type: string
 *                 description: Payment reference/transaction ID
 *     responses:
 *       201:
 *         description: Payment recorded
 *       400:
 *         description: Validation error (e.g., overpayment)
 */
router.get('/payments', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPayments);
router.get('/payments/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPaymentById);
router.post('/payments', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createPayment);
router.get('/invoices/:invoiceId/payments', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPaymentsByInvoice);

// ==================== PURCHASE ORDERS ====================
router.get('/purchase-orders', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPurchaseOrders);
router.post('/purchase-orders', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createPurchaseOrder);
router.get('/purchase-orders/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadPurchaseOrderPDF);
router.get('/purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPurchaseOrderById);
router.put('/purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updatePurchaseOrder);
router.patch('/purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updatePurchaseOrder);
router.delete('/purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deletePurchaseOrder);

// ==================== EXPENSES ====================
router.get('/expenses', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getExpenses);
router.post('/expenses', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createExpense);
router.patch('/expenses/:id/status', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateExpenseStatus);
router.post('/expenses/:id/post', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), postExpense);

// ==================== VENDORS ====================
router.get('/vendors', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getVendors);
router.get('/vendors/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getVendorById);
router.post('/vendors', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createVendor);
router.put('/vendors/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateVendor);
router.delete('/vendors/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteVendor);

// ==================== INVOICE PDF LOCK & REVISION ====================
router.post('/invoices/:id/lock', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), lockInvoicePDF);
router.post('/invoices/:id/revise', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createInvoiceRevision);

// ==================== BASTS ====================
router.get('/basts', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getBasts);
router.get('/basts/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadBastPDF);
router.get('/basts/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getBastById);
router.post('/basts', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createBast);
router.put('/basts/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateBast);
router.delete('/basts/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteBast);

// ==================== PROJECTS ====================
router.get('/projects', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getProjects);
router.get('/projects/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getProjectById);
router.post('/projects', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createProject);
router.put('/projects/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateProject);
router.delete('/projects/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteProject);

// ==================== TAX TYPES ====================
router.get('/tax-types', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getTaxTypes);
router.get('/tax-types/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadTaxTypePDF);
router.get('/tax-types/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getTaxTypeById);
router.post('/tax-types', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createTaxType);
router.put('/tax-types/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateTaxType);
router.delete('/tax-types/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteTaxType);

// ==================== PROPOSAL PENAWARAN ====================
router.get('/proposal-penawaran', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getProposals);
router.get('/proposal-penawaran/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadProposalPDF);
router.get('/proposal-penawaran/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getProposalById);
router.post('/proposal-penawaran', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createProposal);
router.put('/proposal-penawaran/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateProposal);
router.delete('/proposal-penawaran/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteProposal);

export default router;
