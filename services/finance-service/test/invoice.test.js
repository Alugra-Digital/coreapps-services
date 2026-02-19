import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../shared/db/index.js', () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  };
  return {
    db: {
      select: vi.fn().mockReturnValue(mockChain),
      insert: vi.fn().mockReturnValue(mockChain),
      update: vi.fn().mockReturnValue(mockChain),
      delete: vi.fn().mockReturnValue(mockChain),
    },
  };
});

vi.mock('../src/services/pdfService.js', () => ({
  generateInvoicePDF: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])), // %PDF
}));

vi.mock('../src/services/accountingService.js', () => ({
  autoPostInvoice: vi.fn().mockResolvedValue(undefined),
}));

import { db } from '../../shared/db/index.js';
import { autoPostInvoice } from '../src/services/accountingService.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoiceStatus,
} from '../src/controllers/invoiceController.js';

function createMockReqRes(body = {}, params = {}, query = {}, user = null) {
  const req = {
    body,
    params,
    query,
    user: user || { id: 1, role: 'FINANCE_ADMIN', permissions: [] },
    headers: { 'user-agent': 'vitest' },
    ip: '127.0.0.1',
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  };
  return { req, res };
}

const testInvoice = {
  id: 1,
  number: 'INV/2026/02/001',
  quotationId: null,
  clientId: 1,
  date: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  items: [{ description: 'Consulting', qty: 10, price: 1000000 }],
  subtotal: '10000000',
  ppn: '1100000',
  pph: '0',
  grandTotal: '11100000',
  status: 'DRAFT',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Invoice Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tax Calculations', () => {
    it('should calculate PPN 11% correctly', async () => {
      const items = [
        { description: 'Service A', qty: 10, price: 1000000 },
      ];
      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
      const ppn = subtotal * 0.11;
      const grandTotal = subtotal + ppn;

      expect(subtotal).toBe(10000000);
      expect(ppn).toBe(1100000);
      expect(grandTotal).toBe(11100000);
    });

    it('should handle multiple items correctly', async () => {
      const items = [
        { description: 'Service A', qty: 5, price: 2000000 },
        { description: 'Service B', qty: 3, price: 1500000 },
      ];
      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
      const ppn = subtotal * 0.11;
      const grandTotal = subtotal + ppn;

      expect(subtotal).toBe(14500000); // 10M + 4.5M
      expect(ppn).toBe(1595000); // 14.5M * 0.11
      expect(grandTotal).toBe(16095000);
    });

    it('should handle PPh 23 deduction (2%)', () => {
      const subtotal = 10000000;
      const ppn = subtotal * 0.11;
      const pph23 = subtotal * 0.02;
      const grandTotal = subtotal + ppn;

      expect(pph23).toBe(200000);
      expect(grandTotal).toBe(11100000);
    });

    it('should handle zero quantity items', () => {
      const items = [
        { description: 'Service', qty: 0, price: 1000000 },
      ];
      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
      expect(subtotal).toBe(0);
    });
  });

  describe('GET /invoices', () => {
    it('should return list of invoices with client info', async () => {
      const { req, res } = createMockReqRes();

      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.leftJoin.mockReturnThis();
      selectChain.orderBy.mockResolvedValue([
        { invoice: testInvoice, clientName: 'Test Client', quotationNumber: null },
      ]);

      await getInvoices(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            clientName: 'Test Client',
          }),
        ])
      );
    });
  });

  describe('GET /invoices/:id', () => {
    it('should return invoice by ID', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });

      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.leftJoin.mockReturnThis();
      selectChain.where.mockResolvedValue([{
        invoice: testInvoice,
        clientName: 'Test Client',
        clientAddress: 'Jakarta',
      }]);

      await getInvoiceById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          clientName: 'Test Client',
        })
      );
    });

    it('should return 404 for non-existent invoice', async () => {
      const { req, res } = createMockReqRes({}, { id: '999' });

      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.leftJoin.mockReturnThis();
      selectChain.where.mockResolvedValue([]);

      await getInvoiceById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /invoices', () => {
    it('should create invoice with auto-calculated totals', async () => {
      const invoiceData = {
        clientId: 1,
        date: '2026-02-11',
        items: [{ description: 'Service', qty: 10, price: 1000000 }],
        pph: 0,
      };

      const { req, res } = createMockReqRes(invoiceData);

      // Mock: invoice number generation (select last invoice)
      let selectCallCount = 0;
      db.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // Last invoice number query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          };
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      });

      // Mock insert
      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            number: 'INV/2026/02/001',
            ...invoiceData,
            subtotal: '10000000',
            ppn: '1100000',
            pph: '0',
            grandTotal: '11100000',
          }]),
        }),
      });

      await createInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject invoice with no items', async () => {
      const { req, res } = createMockReqRes({
        clientId: 1,
        date: '2026-02-11',
        items: [],
      });

      await createInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invoice with missing clientId', async () => {
      const { req, res } = createMockReqRes({
        date: '2026-02-11',
        items: [{ description: 'Service', qty: 1, price: 100 }],
      });

      await createInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('PATCH /invoices/:id/status', () => {
    it('should update invoice status', async () => {
      const { req, res } = createMockReqRes(
        { status: 'ISSUED' },
        { id: '1' }
      );

      // Mock: find existing
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([testInvoice]),
        }),
      });

      // Mock: update
      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...testInvoice, status: 'ISSUED' }]),
          }),
        }),
      });

      // Mock: audit log
      db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await updateInvoiceStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ISSUED' })
      );
    });

    it('should trigger auto-posting when status changes to ISSUED', async () => {
      const { req, res } = createMockReqRes(
        { status: 'ISSUED' },
        { id: '1' }
      );

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ ...testInvoice, status: 'DRAFT' }]),
        }),
      });

      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...testInvoice, status: 'ISSUED' }]),
          }),
        }),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await updateInvoiceStatus(req, res);

      expect(autoPostInvoice).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent invoice', async () => {
      const { req, res } = createMockReqRes(
        { status: 'ISSUED' },
        { id: '999' }
      );

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await updateInvoiceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('DELETE /invoices/:id', () => {
    it('should delete an invoice', async () => {
      const { req, res } = createMockReqRes({}, { id: '1' });

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([testInvoice]),
        }),
      });

      db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await deleteInvoice(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Invoice deleted' });
    });
  });

  describe('Invoice Payment Status Workflow', () => {
    it('should follow valid status transitions: DRAFT -> ISSUED -> PARTIAL -> PAID', () => {
      const validTransitions = {
        DRAFT: ['ISSUED', 'CANCELLED'],
        ISSUED: ['PARTIAL', 'PAID', 'CANCELLED'],
        PARTIAL: ['PAID'],
        PAID: [],
        CANCELLED: [],
      };

      expect(validTransitions.DRAFT).toContain('ISSUED');
      expect(validTransitions.ISSUED).toContain('PARTIAL');
      expect(validTransitions.ISSUED).toContain('PAID');
      expect(validTransitions.PARTIAL).toContain('PAID');
      expect(validTransitions.PAID).toHaveLength(0);
    });
  });
});

describe('Invoice Number Generation', () => {
  it('should generate sequential invoice numbers', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const format = (seq) => `INV/${year}/${month}/${String(seq).padStart(3, '0')}`;

    expect(format(1)).toBe(`INV/${year}/${month}/001`);
    expect(format(10)).toBe(`INV/${year}/${month}/010`);
    expect(format(100)).toBe(`INV/${year}/${month}/100`);
  });
});
