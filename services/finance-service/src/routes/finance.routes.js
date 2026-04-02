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
  updateInvoiceStatus,
  recordInvoicePayment,
} from '../controllers/invoiceController.js';
import {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsByInvoice
} from '../controllers/paymentController.js';
import { getPaymentsOverview } from '../controllers/paymentOverviewController.js';
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
  signBast,
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
  getAll as getAllSettings,
  getByKey as getSettingByKey,
  upsert as upsertSetting,
} from '../controllers/financeSettingController.js';
import {
  getAll as getAllPeriods,
  getById as getPeriodById,
  create as createPeriod,
  closePeriod,
  reopenPeriod,
  lockPeriod,
  validateClose,
  createNext,
  getLastOpen,
  generateNumber,
} from '../controllers/accountingPeriodController.js';
import {
  getList as getKasKecilList,
  getById as getKasKecilById,
  create as createKasKecil,
  update as updateKasKecil,
  remove as deleteKasKecil,
  getReconciliation,
  reconcileCash,
} from '../controllers/kasKecilController.js';
import {
  getList as getKasBankList,
  getById as getKasBankById,
  create as createKasBank,
  update as updateKasBank,
  remove as deleteKasBank,
} from '../controllers/kasBankController.js';
import {
  getList as getJurnalMemorialList,
  getById as getJurnalMemorialById,
  create as createJurnalMemorial,
  update as updateJurnalMemorial,
  post as postJurnalMemorial,
  remove as deleteJurnalMemorial,
} from '../controllers/jurnalMemorialController.js';
import {
  getList as getVoucherList,
  getById as getVoucherById,
  create as createVoucher,
  update as updateVoucher,
  submit as submitVoucher,
  review as reviewVoucher,
  approve as approveVoucher,
  pay as payVoucher,
  reject as rejectVoucher,
  cancel as cancelVoucher,
  remove as deleteVoucher,
  generateFromKasKecil as generateVoucherFromKasKecil,
  generateFromKasBank as generateVoucherFromKasBank,
} from '../controllers/voucherController.js';
import {
  getList as getAssetAcqJournalList,
  getById as getAssetAcqJournalById,
  create as createAssetAcqJournal,
  update as updateAssetAcqJournal,
  post as postAssetAcqJournal,
  remove as deleteAssetAcqJournal,
  generateFromKasBank as generateAssetJournalFromKasBank,
} from '../controllers/assetAcquisitionJournalController.js';
import {
  getNeracaSaldo as getNeracaSaldo,
} from '../controllers/neracaSaldoController.js';
import {
  getList as getBukuBesarList,
  getByAccount as getBukuBesarByAccount,
  postFromVoucher as postBukuBesar,
} from '../controllers/bukuBesarController.js';
import {
  getList as getAssetDepJournalList,
  generate as generateAssetDepJournal,
  generateAndPost as generateAndPostAssetDepJournal,
  postAll as postAllAssetDepJournals,
  remove as deleteAssetDepJournal,
} from '../controllers/assetDepreciationJournalController.js';
import {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  downloadProposalPDF,
} from '../controllers/proposalPenawaranController.js';
import { getFinanceOverview } from '../controllers/financeOverviewController.js';
import {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import {
  getClientPurchaseOrders,
  getClientPurchaseOrderById,
  createClientPurchaseOrder,
  updateClientPurchaseOrder,
  verifyClientPurchaseOrder,
  deleteClientPurchaseOrder,
} from '../controllers/clientPurchaseOrderController.js';

const router = express.Router();

// ==================== FINANCE OVERVIEW ====================
router.get('/overview', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getFinanceOverview);

// ==================== TRANSACTIONS ====================
router.get('/transactions', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getTransactions);
router.post('/transactions', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createTransaction);
router.get('/transactions/:transactionId', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getTransactionById);
router.put('/transactions/:transactionId', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateTransaction);
router.delete('/transactions/:transactionId', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteTransaction);

// ==================== CLIENT PURCHASE ORDERS (PO MASUK) ====================
router.get('/client-purchase-orders', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getClientPurchaseOrders);
router.post('/client-purchase-orders', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createClientPurchaseOrder);
router.get('/client-purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getClientPurchaseOrderById);
router.put('/client-purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateClientPurchaseOrder);
router.patch('/client-purchase-orders/:id/verify', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), verifyClientPurchaseOrder);
router.delete('/client-purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteClientPurchaseOrder);

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

// Vendor Quotations (alias for quotations - CoreApps 2.0)
router.get('/vendor-quotations', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getQuotations);
router.post('/vendor-quotations', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createQuotation);
router.get('/vendor-quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getQuotationById);
router.put('/vendor-quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateQuotation);
router.patch('/vendor-quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateQuotation);
router.delete('/vendor-quotations/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deleteQuotation);

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
router.post('/invoices/:id/payments', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), recordInvoicePayment);
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
router.get('/payments/overview', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPaymentsOverview);
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

// Vendor Purchase Orders (alias for purchase-orders - CoreApps 2.0)
router.get('/vendor-purchase-orders', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPurchaseOrders);
router.post('/vendor-purchase-orders', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createPurchaseOrder);
router.get('/vendor-purchase-orders/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadPurchaseOrderPDF);
router.get('/vendor-purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPurchaseOrderById);
router.put('/vendor-purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updatePurchaseOrder);
router.patch('/vendor-purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updatePurchaseOrder);
router.delete('/vendor-purchase-orders/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deletePurchaseOrder);

// Purchase Order (singular alias - CoreApps 2.0)
router.get('/purchase-order', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPurchaseOrders);
router.post('/purchase-order', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createPurchaseOrder);
router.get('/purchase-order/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadPurchaseOrderPDF);
router.get('/purchase-order/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getPurchaseOrderById);
router.put('/purchase-order/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updatePurchaseOrder);
router.patch('/purchase-order/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updatePurchaseOrder);
router.delete('/purchase-order/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), deletePurchaseOrder);

// ==================== EXPENSES ====================
router.get('/expenses', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getExpenses);
router.post('/expenses', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createExpense);
router.patch('/expenses/:id/status', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateExpenseStatus);
router.post('/expenses/:id/post', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), postExpense);

// ==================== INVOICE PDF LOCK & REVISION ====================
router.post('/invoices/:id/lock', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), lockInvoicePDF);
router.post('/invoices/:id/revise', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createInvoiceRevision);

// ==================== BASTS ====================
router.get('/basts', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getBasts);
router.get('/basts/:id/pdf', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), downloadBastPDF);
router.get('/basts/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), getBastById);
router.post('/basts', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), createBast);
router.put('/basts/:id', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), updateBast);
router.patch('/basts/:id/sign', authenticate, authorize(['FINANCE_ADMIN', 'SUPER_ADMIN']), signBast);
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

// ==================== ACCOUNTING PERIODS ====================
const FINANCE_ROLES = ['FINANCE_ADMIN', 'SUPER_ADMIN'];
router.get('/accounting-periods', authenticate, authorize(FINANCE_ROLES), getAllPeriods);
router.post('/accounting-periods', authenticate, authorize(FINANCE_ROLES), createPeriod);
router.get('/accounting-periods/last-open', authenticate, authorize(FINANCE_ROLES), getLastOpen);
router.get('/accounting-periods/:id', authenticate, authorize(FINANCE_ROLES), getPeriodById);
router.get('/accounting-periods/:id/validate-close', authenticate, authorize(FINANCE_ROLES), validateClose);
router.post('/accounting-periods/:id/create-next', authenticate, authorize(FINANCE_ROLES), createNext);
router.post('/accounting-periods/:id/close', authenticate, authorize(FINANCE_ROLES), closePeriod);
router.post('/accounting-periods/:id/reopen', authenticate, authorize(FINANCE_ROLES), reopenPeriod);
router.post('/accounting-periods/:id/lock', authenticate, authorize(FINANCE_ROLES), lockPeriod);
router.post('/accounting-periods/:id/generate-number', authenticate, authorize(FINANCE_ROLES), generateNumber);
router.post('/accounting-periods/:id/validate-close', authenticate, authorize(FINANCE_ROLES), validateClose);

// ==================== KAS KECIL ====================
router.get('/kas-kecil', authenticate, authorize(FINANCE_ROLES), getKasKecilList);
router.post('/kas-kecil', authenticate, authorize(FINANCE_ROLES), createKasKecil);
router.get('/kas-kecil/:id', authenticate, authorize(FINANCE_ROLES), getKasKecilById);
router.put('/kas-kecil/:id', authenticate, authorize(FINANCE_ROLES), updateKasKecil);
router.delete('/kas-kecil/:id', authenticate, authorize(FINANCE_ROLES), deleteKasKecil);
router.get('/kas-kecil/:id/reconcile', authenticate, authorize(FINANCE_ROLES), getReconciliation);
router.post('/kas-kecil/reconcile', authenticate, authorize(FINANCE_ROLES), reconcileCash);

// ==================== KAS BANK ====================
router.get('/kas-bank', authenticate, authorize(FINANCE_ROLES), getKasBankList);
router.post('/kas-bank', authenticate, authorize(FINANCE_ROLES), createKasBank);
router.get('/kas-bank/:id', authenticate, authorize(FINANCE_ROLES), getKasBankById);
router.put('/kas-bank/:id', authenticate, authorize(FINANCE_ROLES), updateKasBank);
router.delete('/kas-bank/:id', authenticate, authorize(FINANCE_ROLES), deleteKasBank);

// ==================== JURNAL MEMORIAL ====================
router.get('/jurnal-memorial', authenticate, authorize(FINANCE_ROLES), getJurnalMemorialList);
router.post('/jurnal-memorial', authenticate, authorize(FINANCE_ROLES), createJurnalMemorial);
router.get('/jurnal-memorial/:id', authenticate, authorize(FINANCE_ROLES), getJurnalMemorialById);
router.put('/jurnal-memorial/:id', authenticate, authorize(FINANCE_ROLES), updateJurnalMemorial);
router.post('/jurnal-memorial/:id/post', authenticate, authorize(FINANCE_ROLES), postJurnalMemorial);
router.delete('/jurnal-memorial/:id', authenticate, authorize(FINANCE_ROLES), deleteJurnalMemorial);

// ==================== VOUCHERS ====================
router.get('/vouchers', authenticate, authorize(FINANCE_ROLES), getVoucherList);
router.post('/vouchers', authenticate, authorize(FINANCE_ROLES), createVoucher);
router.get('/vouchers/:id', authenticate, authorize(FINANCE_ROLES), getVoucherById);
router.put('/vouchers/:id', authenticate, authorize(FINANCE_ROLES), updateVoucher);
router.delete('/vouchers/:id', authenticate, authorize(FINANCE_ROLES), deleteVoucher);
router.post('/vouchers/:id/submit', authenticate, authorize(FINANCE_ROLES), submitVoucher);
router.post('/vouchers/:id/review', authenticate, authorize(FINANCE_ROLES), reviewVoucher);
router.post('/vouchers/:id/approve', authenticate, authorize(FINANCE_ROLES), approveVoucher);
router.post('/vouchers/:id/pay', authenticate, authorize(FINANCE_ROLES), payVoucher);
router.post('/vouchers/:id/reject', authenticate, authorize(FINANCE_ROLES), rejectVoucher);
router.post('/vouchers/:id/cancel', authenticate, authorize(FINANCE_ROLES), cancelVoucher);
router.post('/vouchers/generate/kas-kecil', authenticate, authorize(FINANCE_ROLES), generateVoucherFromKasKecil);
router.post('/vouchers/generate/kas-bank', authenticate, authorize(FINANCE_ROLES), generateVoucherFromKasBank);

// ==================== BUKU BESAR (General Ledger) ====================
router.get('/buku-besar', authenticate, authorize(FINANCE_ROLES), getBukuBesarList);
router.get('/buku-besar/account/:accountNumber', authenticate, authorize(FINANCE_ROLES), getBukuBesarByAccount);
router.post('/buku-besar/post/:voucherId', authenticate, authorize(FINANCE_ROLES), postBukuBesar);

// ==================== ASSET ACQUISITION JOURNALS (Jurnal Memori Aset) ====================
router.get('/asset-acquisition-journals', authenticate, authorize(FINANCE_ROLES), getAssetAcqJournalList);
router.post('/asset-acquisition-journals', authenticate, authorize(FINANCE_ROLES), createAssetAcqJournal);
router.get('/asset-acquisition-journals/:id', authenticate, authorize(FINANCE_ROLES), getAssetAcqJournalById);
router.post('/asset-acquisition-journals/generate/kas-bank', authenticate, authorize(FINANCE_ROLES), generateAssetJournalFromKasBank);
router.put('/asset-acquisition-journals/:id', authenticate, authorize(FINANCE_ROLES), updateAssetAcqJournal);
router.delete('/asset-acquisition-journals/:id', authenticate, authorize(FINANCE_ROLES), deleteAssetAcqJournal);
router.post('/asset-acquisition-journals/:id/post', authenticate, authorize(FINANCE_ROLES), postAssetAcqJournal);

// ==================== ASSET DEPRECIATION JOURNALS (Jurnal Penyusutan Aset) ====================
router.get('/asset-depreciation-journals', authenticate, authorize(FINANCE_ROLES), getAssetDepJournalList);
router.post('/asset-depreciation-journals/generate', authenticate, authorize(FINANCE_ROLES), generateAssetDepJournal);
router.post('/asset-depreciation-journals/generate-and-post', authenticate, authorize(FINANCE_ROLES), generateAndPostAssetDepJournal);
router.post('/asset-acquisition-journals/generate/kas-bank', authenticate, authorize(FINANCE_ROLES), generateAssetJournalFromKasBank);
router.get('/neraca-saldo', authenticate, authorize(FINANCE_ROLES), getNeracaSaldo);
router.post('/neraca-saldo', authenticate, authorize(FINANCE_ROLES), getNeracaSaldo);

router.post('/asset-depreciation-journals/post-all', authenticate, authorize(FINANCE_ROLES), postAllAssetDepJournals);
router.delete('/asset-depreciation-journals/:id', authenticate, authorize(FINANCE_ROLES), deleteAssetDepJournal);

// ==================== FINANCE SETTINGS ====================
router.get('/settings', authenticate, authorize(FINANCE_ROLES), getAllSettings);
router.get('/settings/:key', authenticate, authorize(FINANCE_ROLES), getSettingByKey);
router.put('/settings/:key', authenticate, authorize(FINANCE_ROLES), upsertSetting);

export default router;
