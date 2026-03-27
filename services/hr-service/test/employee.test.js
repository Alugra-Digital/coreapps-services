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
    innerJoin: vi.fn().mockReturnThis(),
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

vi.mock('../src/services/minioService.js', () => ({
  uploadDocument: vi.fn().mockResolvedValue('documents/EMP001_ktp_123456.pdf'),
  getPresignedUrl: vi.fn().mockResolvedValue('https://minio.test/presigned-url'),
}));

import { db } from '../../shared/db/index.js';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../src/controllers/employeeController.js';

function createMockReqRes(body = {}, params = {}, query = {}, user = null) {
  const req = {
    body,
    params,
    query,
    user: user || { id: 1, role: 'SUPER_ADMIN', permissions: [] },
    headers: { 'user-agent': 'vitest' },
    ip: '127.0.0.1',
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

const testEmployee = {
  id: 1,
  nik: 'EMP001',
  name: 'John Doe',
  ktp: '1234567890123456',
  npwp: '12.345.678.9-012.000',
  department: 'IT',
  position: 'Software Developer',
  status: 'ACTIVE',
  joinDate: new Date('2024-01-15'),
  bankName: 'BCA',
  bankAccount: '1234567890',
  ptkp: 'TK/0',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('Employee Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /employees', () => {
    it('should return paginated employee list', async () => {
      const { req, res } = createMockReqRes({}, {}, { page: '1', limit: '10' });

      // Mock count query
      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.where.mockReturnValue({
        ...selectChain,
        then: (resolve) => resolve([{ count: 5 }]),
      });

      // For the data query, mock differently - this is tricky with chaining
      // We need to mock the second call to db.select differently
      let callCount = 0;
      db.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Count query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 5 }]),
            }),
          };
        }
        // Data query
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([testEmployee]),
                }),
              }),
            }),
          }),
        };
      });

      await getEmployees(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        })
      );
    });

    it('should hide bank info for FINANCE_ADMIN', async () => {
      const { req, res } = createMockReqRes(
        {}, {}, { page: '1', limit: '10' },
        { id: 2, role: 'FINANCE_ADMIN', permissions: [] }
      );

      let callCount = 0;
      db.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 1 }]),
            }),
          };
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([testEmployee]),
                }),
              }),
            }),
          }),
        };
      });

      await getEmployees(req, res);

      const jsonCall = res.json.mock.calls[0][0];
      if (jsonCall.data && jsonCall.data.length > 0) {
        expect(jsonCall.data[0]).not.toHaveProperty('bankName');
        expect(jsonCall.data[0]).not.toHaveProperty('bankAccount');
      }
    });
  });

  describe('GET /employees/:nik', () => {
    it('should return employee by NIK', async () => {
      const { req, res } = createMockReqRes({}, { id: 'EMP001' });

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([testEmployee]),
        }),
      });

      await getEmployeeById(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nik: 'EMP001' }));
    });

    it('should return 404 when employee not found', async () => {
      const { req, res } = createMockReqRes({}, { id: 'NONEXIST' });

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await getEmployeeById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Employee not found', code: 'NOT_FOUND' }));
    });

    it('should hide bank info for FINANCE_ADMIN', async () => {
      const { req, res } = createMockReqRes(
        {}, { id: 'EMP001' }, {},
        { id: 2, role: 'FINANCE_ADMIN', permissions: [] }
      );

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([testEmployee]),
        }),
      });

      await getEmployeeById(req, res);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('bankName');
      expect(jsonCall).not.toHaveProperty('bankAccount');
      expect(jsonCall).toHaveProperty('namaKaryawan', 'John Doe');
    });
  });

  describe('POST /employees', () => {
    it('should create a new employee with valid data', async () => {
      const employeeData = {
        nik: 'EMP002',
        namaKaryawan: 'Jane Smith',
        noKtp: '9876543210987654',
        namaJabatan: 'HR Manager',
        tmk: '2024-01-15',
      };

      const { req, res } = createMockReqRes(employeeData);

      let insertCallCount = 0;
      db.insert.mockImplementation(() => {
        insertCallCount++;
        if (insertCallCount === 1) {
          // Employee insert
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 2, nik: 'EMP002', name: 'Jane Smith' }]),
            }),
          };
        }
        // Audit log insert
        return {
          values: vi.fn().mockResolvedValue(undefined),
        };
      });

      await createEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 for invalid data (missing required fields)', async () => {
      const invalidData = { nik: '', name: '' };
      const { req, res } = createMockReqRes(invalidData);

      await createEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid KTP (not 16 digits)', async () => {
      const invalidData = { nik: 'EMP003', name: 'Test', ktp: '123', joinDate: '2024-01-01' };
      const { req, res } = createMockReqRes(invalidData);

      await createEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('PATCH /employees/:nik', () => {
    it('should update an existing employee', async () => {
      const { req, res } = createMockReqRes(
        { namaKaryawan: 'Updated Name' },
        { id: 'EMP001' }
      );

      // Mock: find existing
      db.select.mockImplementation(() => {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([testEmployee]),
          }),
        };
      });

      // Mock: update
      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...testEmployee, name: 'Updated Name' }]),
          }),
        }),
      });

      // Mock: audit log
      db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await updateEmployee(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ namaKaryawan: 'Updated Name' })
      );
    });

    it('should return 404 when employee not found for update', async () => {
      const { req, res } = createMockReqRes(
        { name: 'Updated' },
        { nik: 'NONEXIST' }
      );

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await updateEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('DELETE /employees/:nik', () => {
    it('should soft delete employee by NIK', async () => {
      const { req, res } = createMockReqRes({}, { id: 'EMP001' });

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([testEmployee]),
        }),
      });

      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await deleteEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 when employee not found for delete', async () => {
      const { req, res } = createMockReqRes({}, { nik: 'NONEXIST' });

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await deleteEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
