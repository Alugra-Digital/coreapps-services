/**
 * Finance Module CRUD Integration Tests
 *
 * Modules covered:
 *   CRUD-1: Clients
 *   CRUD-2: Invoices
 *   CRUD-3: Purchase Orders
 *   CRUD-4: Vendor Quotations
 *   CRUD-5: Proposal Penawaran
 *   CRUD-6: Perpajakan (Tax Types)
 *   CRUD-7: BAST (Berita Acara Serah Terima)
 *
 * Each module runs: Create → List → Read → Update → Delete → Confirm 404
 *
 * Run:
 *   cd coreapps-alugra/services/tests
 *   npx vitest run integration/e2e-finance-crud.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TODAY = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
let authToken = '';

/**
 * Extracts numeric part from formatted IDs like "CLI-80", "INV-5", "PO-3".
 * Passes through plain numeric strings unchanged.
 */
const numId = (id) => String(id).replace(/^[A-Z]+-/, '');

/**
 * Parses clientId/similar FK fields that must be sent as integers but are
 * returned from the API as formatted strings like "CLI-83".
 */
const toInt = (id) => parseInt(numId(id), 10);

const api = {
  _headers: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  }),
  get: (path) =>
    fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    }),
  post: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: api._headers(),
      body: JSON.stringify(body),
    }),
  put: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: api._headers(),
      body: JSON.stringify(body),
    }),
  patch: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: api._headers(),
      body: JSON.stringify(body),
    }),
  delete: (path) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    }),
};

// ─── Global auth setup ────────────────────────────────────────────────────────

beforeAll(async () => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.TEST_ADMIN_USER || 'admin',
      password: process.env.TEST_ADMIN_PASS || 'Admin@123',
    }),
  });
  expect(res.status, 'Login should return 200').toBe(200);
  const data = await res.json();
  authToken = data.token;
  expect(authToken, 'Auth token must be present').toBeTruthy();
}, 15000);

// ─────────────────────────────────────────────────────────────────────────────
// CRUD-1: CLIENTS
// Response shape: { id:"CLI-X", name, companyName, address, phone, email,
//                   npwp, pic, isActive, createdAt, updatedAt }
// ─────────────────────────────────────────────────────────────────────────────

describe('CRUD-1: Clients', () => {
  let createdId = null;

  it('1.1 Create — POST /api/finance/clients returns 201 with name and id', async () => {
    const res = await api.post('/api/finance/clients', {
      name: 'PT Test CRUD Client',
      companyName: 'PT Test CRUD Client',
      email: 'crud.client@test.com',
      phone: '081234567890',
      address: 'Jl. Sudirman No. 1, Jakarta Pusat',
      npwp: '12.345.678.9-012.345',
      contactType: 'CUSTOMER',
      paymentTerms: 30,
      isActive: true,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    createdId = body.id;
    expect(createdId).toBeTruthy();
    expect(body.name).toBe('PT Test CRUD Client');
    expect(body.email).toBe('crud.client@test.com');
    expect(body.isActive).toBe(true);
  });

  it('1.2 List — GET /api/finance/clients returns 200 with the new client', async () => {
    const res = await api.get('/api/finance/clients');
    expect(res.status).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data ?? body.clients ?? [];
    expect(list.length).toBeGreaterThan(0);
    const found = list.find(
      (c) => String(c.id) === String(createdId) || c.name === 'PT Test CRUD Client',
    );
    expect(found, 'Newly created client should appear in list').toBeDefined();
  });

  it('1.3 Read — GET /api/finance/clients/:id returns correct record', async () => {
    const res = await api.get(`/api/finance/clients/${numId(createdId)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('PT Test CRUD Client');
    expect(body.email).toBe('crud.client@test.com');
  });

  it('1.4 Update — PUT /api/finance/clients/:id returns updated name and email', async () => {
    const res = await api.put(`/api/finance/clients/${numId(createdId)}`, {
      name: 'PT Test CRUD Client Updated',
      email: 'updated.client@test.com',
      contactType: 'CUSTOMER',
      isActive: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('PT Test CRUD Client Updated');
    expect(body.email).toBe('updated.client@test.com');
  });

  it('1.5 Delete — DELETE /api/finance/clients/:id returns 200 or 204', async () => {
    const res = await api.delete(`/api/finance/clients/${numId(createdId)}`);
    expect([200, 204]).toContain(res.status);
  });

  it('1.6 Confirm deleted — GET /api/finance/clients/:id returns 404', async () => {
    const res = await api.get(`/api/finance/clients/${numId(createdId)}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD-2: INVOICES
// Response shape: { id:"INV-X", status, lineItems:[{subtotal,...}],
//                   invoiceInfo, billingInfo, companyInfo, ... }
// clientId in request body must be an integer (not the "CLI-X" string).
// ─────────────────────────────────────────────────────────────────────────────

describe('CRUD-2: Invoices', () => {
  let sharedClientId = null;
  let createdId = null;

  beforeAll(async () => {
    const res = await api.post('/api/finance/clients', {
      name: 'PT Invoice CRUD Client',
      contactType: 'CUSTOMER',
      email: 'invoice.crud@test.com',
    });
    expect(res.status, 'Setup: create client for invoice tests').toBe(201);
    const data = await res.json();
    sharedClientId = data.id;
  });

  afterAll(async () => {
    if (sharedClientId) {
      await api.delete(`/api/finance/clients/${numId(sharedClientId)}`);
    }
  });

  it('2.1 Create — POST /api/finance/invoices returns 201 with lineItems and DRAFT status', async () => {
    const res = await api.post('/api/finance/invoices', {
      clientId: toInt(sharedClientId), // must be integer
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      items: [
        { description: 'Jasa Pengembangan Sistem', qty: 1, price: 10_000_000 },
        { description: 'Lisensi Tahunan Software', qty: 3, price: 500_000 },
      ],
      pph: 0,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    createdId = body.id;
    expect(createdId).toBeTruthy();
    // lineItems[].subtotal sum = 10_000_000 + (3 × 500_000) = 11_500_000
    const totalSubtotal = body.lineItems.reduce((s, i) => s + i.subtotal, 0);
    expect(totalSubtotal).toBe(11_500_000);
    expect(body.lineItems).toHaveLength(2);
    expect(body.status).toBe('DRAFT');
  });

  it('2.2 List — GET /api/finance/invoices returns 200 with records', async () => {
    const res = await api.get('/api/finance/invoices');
    expect(res.status).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data ?? body.invoices ?? [];
    expect(list.length).toBeGreaterThan(0);
  });

  it('2.3 Read — GET /api/finance/invoices/:id returns correct lineItems', async () => {
    const res = await api.get(`/api/finance/invoices/${numId(createdId)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const totalSubtotal = body.lineItems.reduce((s, i) => s + i.subtotal, 0);
    expect(totalSubtotal).toBe(11_500_000);
    expect(body.lineItems).toHaveLength(2);
    expect(body.status).toBe('DRAFT');
  });

  it('2.4 Update status — PATCH /api/finance/invoices/:id/status → ISSUED', async () => {
    const res = await api.patch(`/api/finance/invoices/${numId(createdId)}/status`, {
      status: 'ISSUED',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ISSUED');
  });

  it('2.5 Delete — DELETE /api/finance/invoices/:id returns 200 or 204', async () => {
    const res = await api.delete(`/api/finance/invoices/${numId(createdId)}`);
    expect([200, 204]).toContain(res.status);
  });

  it('2.6 Confirm deleted — GET /api/finance/invoices/:id returns 404', async () => {
    const res = await api.get(`/api/finance/invoices/${numId(createdId)}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD-3: PURCHASE ORDERS
// Response shape: { id:"PO-X", status, vendorInfo:{vendorName,...},
//                   lineItems:[{subtotal,...}], orderInfo, companyInfo, ... }
// date field causes controller error — omit it (auto-set to today).
// ─────────────────────────────────────────────────────────────────────────────

describe('CRUD-3: Purchase Orders', () => {
  let createdId = null;

  it('3.1 Create — POST /api/finance/purchase-orders returns 201 with vendorName and lineItems', async () => {
    const res = await api.post('/api/finance/purchase-orders', {
      supplierName: 'PT Supplier Test CRUD',
      // date omitted — controller auto-sets today
      items: [
        {
          description: 'Server Dell PowerEdge R740',
          quantity: 2,
          unitPrice: 35_000_000,
          total: 70_000_000,
        },
        {
          description: 'Switch Cisco Catalyst 2960',
          quantity: 1,
          unitPrice: 15_000_000,
          total: 15_000_000,
        },
      ],
      status: 'DRAFT',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    createdId = body.id;
    expect(createdId).toBeTruthy();
    expect(body.vendorInfo?.vendorName).toBe('PT Supplier Test CRUD');
    // subtotal = 70_000_000 + 15_000_000 = 85_000_000
    const totalSubtotal = body.lineItems.reduce((s, i) => s + i.subtotal, 0);
    expect(totalSubtotal).toBe(85_000_000);
    expect(body.lineItems).toHaveLength(2);
    expect(body.status).toBe('DRAFT');
  });

  it('3.2 List — GET /api/finance/purchase-orders returns 200 with records', async () => {
    const res = await api.get('/api/finance/purchase-orders');
    expect(res.status).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data ?? body.purchaseOrders ?? [];
    expect(list.length).toBeGreaterThan(0);
  });

  it('3.3 Read — GET /api/finance/purchase-orders/:id returns correct record', async () => {
    const res = await api.get(`/api/finance/purchase-orders/${numId(createdId)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vendorInfo?.vendorName).toBe('PT Supplier Test CRUD');
    expect(body.lineItems).toHaveLength(2);
    expect(body.status).toBe('DRAFT');
  });

  it('3.4 Update — PUT /api/finance/purchase-orders/:id returns updated vendorName and status', async () => {
    const res = await api.put(`/api/finance/purchase-orders/${numId(createdId)}`, {
      supplierName: 'PT Supplier Test CRUD Updated',
      status: 'APPROVED',
      items: [
        {
          description: 'Server Dell PowerEdge R740',
          quantity: 2,
          unitPrice: 35_000_000,
          total: 70_000_000,
        },
        {
          description: 'Switch Cisco Catalyst 2960',
          quantity: 1,
          unitPrice: 15_000_000,
          total: 15_000_000,
        },
      ],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vendorInfo?.vendorName).toBe('PT Supplier Test CRUD Updated');
    expect(body.status).toBe('APPROVED');
  });

  it('3.5 Delete — DELETE /api/finance/purchase-orders/:id returns 200 or 204', async () => {
    const res = await api.delete(`/api/finance/purchase-orders/${numId(createdId)}`);
    expect([200, 204]).toContain(res.status);
  });

  it('3.6 Confirm deleted — GET /api/finance/purchase-orders/:id returns 404', async () => {
    const res = await api.get(`/api/finance/purchase-orders/${numId(createdId)}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD-4: VENDOR QUOTATIONS
// Response shape: { id:"9" (plain numeric string!), subtotal, lineItems:[...],
//                   quotationNumber, status:"DRAFT", clientName, ... }
// clientId must be integer in request body.
// date is required as 'YYYY-MM-DD' string.
// ─────────────────────────────────────────────────────────────────────────────

describe('CRUD-4: Vendor Quotations', () => {
  let sharedClientId = null;
  let createdId = null;

  beforeAll(async () => {
    const res = await api.post('/api/finance/clients', {
      name: 'PT Quotation CRUD Client',
      contactType: 'CUSTOMER',
      email: 'quotation.crud@test.com',
    });
    expect(res.status, 'Setup: create client for quotation tests').toBe(201);
    const data = await res.json();
    sharedClientId = data.id;
  });

  afterAll(async () => {
    if (sharedClientId) {
      await api.delete(`/api/finance/clients/${numId(sharedClientId)}`);
    }
  });

  it('4.1 Create — POST /api/finance/quotations returns 201 with subtotal and DRAFT status', async () => {
    const res = await api.post('/api/finance/quotations', {
      clientId: toInt(sharedClientId), // must be integer
      date: TODAY,                     // required, 'YYYY-MM-DD' format
      scopeOfWork: 'Pengembangan sistem ERP modul keuangan dan akuntansi',
      items: [
        { description: 'Analisa Kebutuhan Sistem', qty: 1, price: 5_000_000 },
        { description: 'Pengembangan Backend API', qty: 1, price: 15_000_000 },
        { description: 'Pengembangan Frontend UI', qty: 1, price: 10_000_000 },
      ],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    createdId = body.id;
    expect(createdId).toBeTruthy();
    // subtotal = 5_000_000 + 15_000_000 + 10_000_000 = 30_000_000
    expect(Number(body.subtotal)).toBe(30_000_000);
    expect(body.lineItems).toHaveLength(3);
    expect(body.status).toBe('DRAFT');
  });

  it('4.2 List — GET /api/finance/quotations returns 200 with records', async () => {
    const res = await api.get('/api/finance/quotations');
    expect(res.status).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data ?? body.quotations ?? [];
    expect(list.length).toBeGreaterThan(0);
  });

  it('4.3 Read — GET /api/finance/quotations/:id returns correct record', async () => {
    const res = await api.get(`/api/finance/quotations/${numId(createdId)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Number(body.subtotal)).toBe(30_000_000);
    expect(body.lineItems).toHaveLength(3);
    expect(body.status).toBe('DRAFT');
  });

  it('4.4 Update — PUT /api/finance/quotations/:id returns updated subtotal', async () => {
    const res = await api.put(`/api/finance/quotations/${numId(createdId)}`, {
      clientId: toInt(sharedClientId),
      date: TODAY,
      scopeOfWork: 'Pengembangan sistem ERP modul keuangan dan akuntansi (Revisi)',
      items: [
        { description: 'Analisa Kebutuhan Sistem', qty: 1, price: 5_000_000 },
        { description: 'Pengembangan Backend API', qty: 1, price: 18_000_000 },
        { description: 'Pengembangan Frontend UI', qty: 1, price: 12_000_000 },
      ],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    // updated subtotal = 5_000_000 + 18_000_000 + 12_000_000 = 35_000_000
    expect(Number(body.subtotal)).toBe(35_000_000);
  });

  it('4.5 Vendor alias — GET /api/finance/vendor-quotations returns 200', async () => {
    const res = await api.get('/api/finance/vendor-quotations');
    expect(res.status).toBe(200);
  });

  it('4.6 Delete — DELETE /api/finance/quotations/:id returns 200 or 204', async () => {
    const res = await api.delete(`/api/finance/quotations/${numId(createdId)}`);
    expect([200, 204]).toContain(res.status);
  });

  it('4.7 Confirm deleted — GET /api/finance/quotations/:id returns 404', async () => {
    const res = await api.get(`/api/finance/quotations/${numId(createdId)}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD-5: PROPOSAL PENAWARAN
// Response shape: { id:"PP-X", proposalNumber, coverInfo, clientInfo,
//                   items:[...], totalEstimatedCost(number), status:"draft", ... }
// ─────────────────────────────────────────────────────────────────────────────

describe('CRUD-5: Proposal Penawaran', () => {
  let createdId = null;
  const proposalNumber = `PP-CRUD-${Date.now()}`;

  it('5.1 Create — POST /api/finance/proposal-penawaran returns 201', async () => {
    const res = await api.post('/api/finance/proposal-penawaran', {
      proposalNumber,
      coverInfo: {
        title: 'Penawaran Layanan Pengembangan IT',
        date: TODAY,
        companyName: 'PT Alugra Digital Indonesia',
        location: 'Jakarta',
      },
      clientInfo: {
        companyName: 'PT Test Client Proposal CRUD',
        address: 'Jl. Gatot Subroto No. 10, Jakarta Selatan',
        contactPerson: 'Budi Santoso',
        phone: '02159876543',
      },
      documentApproval: {
        preparedBy: 'Tim Penjualan',
        checkedBy: 'Supervisor',
        approvedBy: 'Manager',
      },
      items: [
        {
          no: 1,
          description: 'Implementasi Modul ERP Finance',
          unit: 'paket',
          qty: 1,
          unitPrice: 50_000_000,
          total: 50_000_000,
        },
        {
          no: 2,
          description: 'Pelatihan dan Pendampingan (3 bulan)',
          unit: 'bulan',
          qty: 3,
          unitPrice: 5_000_000,
          total: 15_000_000,
        },
      ],
      totalEstimatedCost: 65_000_000,
      totalEstimatedCostInWords: 'Enam Puluh Lima Juta Rupiah',
      currency: 'IDR',
      scopeOfWork: [
        'Analisa kebutuhan dan business process review',
        'Implementasi modul keuangan',
        'Training dan go-live support',
      ],
      termsAndConditions: [
        'Pembayaran 50% di muka, 50% setelah selesai',
        'Garansi bug-fix 3 bulan setelah go-live',
      ],
      status: 'draft',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    createdId = body.id;
    expect(createdId).toBeTruthy();
    expect(Number(body.totalEstimatedCost)).toBe(65_000_000);
    expect(body.proposalNumber).toBe(proposalNumber);
    expect(body.status).toBe('draft');
  });

  it('5.2 List — GET /api/finance/proposal-penawaran returns 200 with records', async () => {
    const res = await api.get('/api/finance/proposal-penawaran');
    expect(res.status).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data ?? body.proposals ?? [];
    expect(list.length).toBeGreaterThan(0);
  });

  it('5.3 Read — GET /api/finance/proposal-penawaran/:id returns correct record', async () => {
    const res = await api.get(`/api/finance/proposal-penawaran/${numId(createdId)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.proposalNumber).toBe(proposalNumber);
    expect(Number(body.totalEstimatedCost)).toBe(65_000_000);
    expect(body.totalEstimatedCostInWords).toBe('Enam Puluh Lima Juta Rupiah');
  });

  it('5.4 Update — PUT /api/finance/proposal-penawaran/:id returns updated totalEstimatedCost', async () => {
    const res = await api.put(`/api/finance/proposal-penawaran/${numId(createdId)}`, {
      proposalNumber,
      coverInfo: {
        title: 'Penawaran Layanan Pengembangan IT (Revisi 1)',
        date: TODAY,
        companyName: 'PT Alugra Digital Indonesia',
        location: 'Jakarta',
      },
      clientInfo: {
        companyName: 'PT Test Client Proposal CRUD',
        address: 'Jl. Gatot Subroto No. 10, Jakarta Selatan',
      },
      documentApproval: {
        preparedBy: 'Tim Penjualan',
        approvedBy: 'Senior Manager',
      },
      items: [
        {
          no: 1,
          description: 'Implementasi Modul ERP Finance (Revisi)',
          unit: 'paket',
          qty: 1,
          unitPrice: 55_000_000,
          total: 55_000_000,
        },
        {
          no: 2,
          description: 'Pelatihan dan Pendampingan (3 bulan)',
          unit: 'bulan',
          qty: 3,
          unitPrice: 5_000_000,
          total: 15_000_000,
        },
      ],
      totalEstimatedCost: 70_000_000,
      totalEstimatedCostInWords: 'Tujuh Puluh Juta Rupiah',
      currency: 'IDR',
      status: 'draft',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Number(body.totalEstimatedCost)).toBe(70_000_000);
    expect(body.totalEstimatedCostInWords).toBe('Tujuh Puluh Juta Rupiah');
  });

  it('5.5 Delete — DELETE /api/finance/proposal-penawaran/:id returns 200 or 204', async () => {
    const res = await api.delete(`/api/finance/proposal-penawaran/${numId(createdId)}`);
    expect([200, 204]).toContain(res.status);
  });

  it('5.6 Confirm deleted — GET /api/finance/proposal-penawaran/:id returns 404', async () => {
    const res = await api.get(`/api/finance/proposal-penawaran/${numId(createdId)}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD-6: PERPAJAKAN (TAX TYPES)
// Response shape: { id:"TAX-X", code, name, rate(number), category,
//                   description, regulation, applicableDocuments(array),
//                   documentUrl, isActive, createdAt, updatedAt }
// ─────────────────────────────────────────────────────────────────────────────

describe('CRUD-6: Perpajakan (Tax Types)', () => {
  let createdId = null;
  const taxCode = `PPH-CRUD-${Date.now()}`;

  it('6.1 Create — POST /api/finance/tax-types returns 201 with correct fields', async () => {
    const res = await api.post('/api/finance/tax-types', {
      code: taxCode,
      name: 'PPh 23 CRUD Test',
      rate: 0.02,
      category: 'PPh',
      description: 'Pajak Penghasilan Pasal 23 — dipotong atas jasa & royalti',
      regulation: 'UU No. 36 Tahun 2008 Pasal 23',
      applicableDocuments: ['INVOICE', 'PURCHASE_ORDER'],
      isActive: true,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    createdId = body.id;
    expect(createdId).toBeTruthy();
    expect(body.code).toBe(taxCode);
    expect(body.name).toBe('PPh 23 CRUD Test');
    expect(Number(body.rate)).toBe(0.02);
    expect(body.category).toBe('PPh');
    expect(body.isActive).toBe(true);
  });

  it('6.2 List — GET /api/finance/tax-types returns 200 with the new tax type', async () => {
    const res = await api.get('/api/finance/tax-types');
    expect(res.status).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data ?? body.taxTypes ?? [];
    expect(list.length).toBeGreaterThan(0);
    const found = list.find(
      (t) => t.code === taxCode || String(t.id) === numId(String(createdId)),
    );
    expect(found, 'Newly created tax type should appear in list').toBeDefined();
  });

  it('6.3 Read — GET /api/finance/tax-types/:id returns correct record', async () => {
    const res = await api.get(`/api/finance/tax-types/${numId(createdId)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toBe(taxCode);
    expect(body.category).toBe('PPh');
    expect(body.isActive).toBe(true);
    expect(body.applicableDocuments).toContain('INVOICE');
  });

  it('6.4 Update — PUT /api/finance/tax-types/:id returns updated name and rate', async () => {
    const res = await api.put(`/api/finance/tax-types/${numId(createdId)}`, {
      code: taxCode,
      name: 'PPh 23 CRUD Test Updated',
      rate: 0.025,
      category: 'PPh',
      description: 'Updated — rate naik 0.5%',
      regulation: 'UU No. 36 Tahun 2008 Pasal 23 (Amended)',
      applicableDocuments: ['INVOICE', 'PURCHASE_ORDER', 'BAST'],
      isActive: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('PPh 23 CRUD Test Updated');
    expect(Number(body.rate)).toBe(0.025);
    expect(body.applicableDocuments).toContain('BAST');
  });

  it('6.5 Delete — DELETE /api/finance/tax-types/:id returns 200 or 204', async () => {
    const res = await api.delete(`/api/finance/tax-types/${numId(createdId)}`);
    expect([200, 204]).toContain(res.status);
  });

  it('6.6 Confirm deleted — GET /api/finance/tax-types/:id returns 404', async () => {
    const res = await api.get(`/api/finance/tax-types/${numId(createdId)}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD-7: BAST (Berita Acara Serah Terima)
// Response shape: { id:"BAST-X", coverInfo, documentInfo, deliveringParty,
//                   receivingParty, projectId, status:"DRAFT",
//                   linkedInvoiceIds:[], createdAt, updatedAt }
// ─────────────────────────────────────────────────────────────────────────────

describe('CRUD-7: BAST (Berita Acara Serah Terima)', () => {
  let createdId = null;

  it('7.1 Create — POST /api/finance/basts returns 201 with DRAFT status', async () => {
    const res = await api.post('/api/finance/basts', {
      coverInfo: {
        title: 'BAST Pengembangan Sistem ERP Finance',
        date: TODAY,
        location: 'Jakarta',
        documentNumber: `BAST-CRUD-${Date.now()}`,
      },
      documentInfo: {
        contractNumber: 'SPK/2026/CRUD/001',
        contractDate: '2026-01-15',
        projectName: 'Pengembangan Sistem ERP Finance PT Alugra',
        completionDate: TODAY,
        deliverables: [
          'Source code backend (Node.js)',
          'Source code frontend (React)',
          'Dokumentasi API',
        ],
      },
      deliveringParty: {
        companyName: 'PT Alugra Digital Indonesia',
        address: 'Jl. Sudirman No. 1, Jakarta Pusat',
        representative: 'Ahmad Fauzi',
        position: 'Project Manager',
        phone: '02150001234',
      },
      receivingParty: {
        companyName: 'PT Test Client BAST CRUD',
        address: 'Jl. Thamrin No. 5, Jakarta Pusat',
        representative: 'Budi Santoso',
        position: 'IT Manager',
        phone: '02150005678',
      },
      status: 'DRAFT',
      linkedInvoiceIds: [],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    createdId = body.id;
    expect(createdId).toBeTruthy();
    expect(body.status).toBe('DRAFT');
    expect(body.coverInfo).toBeDefined();
    expect(body.deliveringParty.companyName).toBe('PT Alugra Digital Indonesia');
    expect(body.receivingParty.companyName).toBe('PT Test Client BAST CRUD');
  });

  it('7.2 List — GET /api/finance/basts returns 200 with records', async () => {
    const res = await api.get('/api/finance/basts');
    expect(res.status).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data ?? body.basts ?? [];
    expect(list.length).toBeGreaterThan(0);
  });

  it('7.3 Read — GET /api/finance/basts/:id returns correct record', async () => {
    const res = await api.get(`/api/finance/basts/${numId(createdId)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('DRAFT');
    expect(body.deliveringParty.companyName).toBe('PT Alugra Digital Indonesia');
    expect(body.receivingParty.companyName).toBe('PT Test Client BAST CRUD');
    expect(body.documentInfo.contractNumber).toBe('SPK/2026/CRUD/001');
  });

  it('7.4 Update — PUT /api/finance/basts/:id returns updated positions', async () => {
    const res = await api.put(`/api/finance/basts/${numId(createdId)}`, {
      coverInfo: {
        title: 'BAST Pengembangan Sistem ERP Finance (Revisi)',
        date: TODAY,
        location: 'Jakarta Selatan',
        documentNumber: `BAST-CRUD-REV-${Date.now()}`,
      },
      documentInfo: {
        contractNumber: 'SPK/2026/CRUD/001',
        projectName: 'Pengembangan Sistem ERP Finance PT Alugra (Final)',
        completionDate: TODAY,
      },
      deliveringParty: {
        companyName: 'PT Alugra Digital Indonesia',
        representative: 'Ahmad Fauzi',
        position: 'Senior Project Manager',
      },
      receivingParty: {
        companyName: 'PT Test Client BAST CRUD',
        representative: 'Budi Santoso',
        position: 'IT Director',
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deliveringParty.position).toBe('Senior Project Manager');
    expect(body.receivingParty.position).toBe('IT Director');
    expect(body.coverInfo.location).toBe('Jakarta Selatan');
  });

  it('7.5 Delete — DELETE /api/finance/basts/:id returns 200 or 204', async () => {
    const res = await api.delete(`/api/finance/basts/${numId(createdId)}`);
    expect([200, 204]).toContain(res.status);
  });

  it('7.6 Confirm deleted — GET /api/finance/basts/:id returns 404', async () => {
    const res = await api.get(`/api/finance/basts/${numId(createdId)}`);
    expect(res.status).toBe(404);
  });
});
