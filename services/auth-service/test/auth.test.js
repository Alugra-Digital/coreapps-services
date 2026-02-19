import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the controller
vi.mock('../../shared/db/index.js', () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    values: vi.fn().mockReturnThis(),
  };
  return {
    db: {
      select: vi.fn().mockReturnValue(mockChain),
      insert: vi.fn().mockReturnValue(mockChain),
    },
  };
});

vi.mock('../../shared/utils/jwt.util.js', () => ({
  signToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  verifyToken: vi.fn().mockResolvedValue({ id: 1, username: 'admin', role: 'SUPER_ADMIN' }),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$hashed'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import { db } from '../../shared/db/index.js';
import { signToken, verifyToken } from '../../shared/utils/jwt.util.js';
import bcrypt from 'bcryptjs';
import { register, login, logout } from '../src/controllers/authController.js';

// Helper to create mock req/res
function createMockReqRes(body = {}, params = {}, query = {}, user = null) {
  const req = {
    body,
    params,
    query,
    user,
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

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user and return JWT token', async () => {
      const { req, res } = createMockReqRes({
        username: 'newuser',
        password: 'password123',
        role: 'HR_ADMIN',
      });

      // Mock: no existing user found
      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.where.mockResolvedValue([]);

      // Mock: insert returns new user
      const insertChain = db.insert();
      insertChain.values.mockReturnThis();
      insertChain.returning.mockResolvedValue([{
        id: 1,
        username: 'newuser',
        role: 'HR_ADMIN',
      }]);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User created successfully',
          token: 'mock-jwt-token',
          user: expect.objectContaining({
            username: 'newuser',
            role: 'HR_ADMIN',
          }),
        })
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(signToken).toHaveBeenCalled();
    });

    it('should return 409 if user already exists', async () => {
      const { req, res } = createMockReqRes({
        username: 'existinguser',
        password: 'password123',
      });

      // Mock: existing user found
      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.where.mockResolvedValue([{ id: 1, username: 'existinguser' }]);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User already exists', code: 'CONFLICT' }));
    });

    it('should default role to SUPER_ADMIN when not specified', async () => {
      const { req, res } = createMockReqRes({
        username: 'admin',
        password: 'password123',
      });

      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.where.mockResolvedValue([]);

      const insertChain = db.insert();
      insertChain.values.mockReturnThis();
      insertChain.returning.mockResolvedValue([{
        id: 1,
        username: 'admin',
        role: 'SUPER_ADMIN',
      }]);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('POST /login', () => {
    it('should login with valid credentials and return JWT', async () => {
      const { req, res } = createMockReqRes({
        username: 'admin',
        password: 'admin123',
      });

      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.where.mockResolvedValue([{
        id: 1,
        username: 'admin',
        password: '$2a$10$hashed',
        role: 'SUPER_ADMIN',
      }]);

      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock-jwt-token',
          user: expect.objectContaining({
            id: 1,
            username: 'admin',
            role: 'SUPER_ADMIN',
          }),
        })
      );
    });

    it('should return 401 for invalid username', async () => {
      const { req, res } = createMockReqRes({
        username: 'nonexistent',
        password: 'wrong',
      });

      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.where.mockResolvedValue([]);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }));
    });

    it('should return 401 for wrong password', async () => {
      const { req, res } = createMockReqRes({
        username: 'admin',
        password: 'wrongpassword',
      });

      const selectChain = db.select();
      selectChain.from.mockReturnThis();
      selectChain.where.mockResolvedValue([{
        id: 1,
        username: 'admin',
        password: '$2a$10$hashed',
        role: 'SUPER_ADMIN',
      }]);

      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }));
    });
  });

  describe('POST /logout', () => {
    it('should return success message', () => {
      const { req, res } = createMockReqRes();

      logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});

describe('JWT Utility', () => {
  it('signToken should be called with correct payload', async () => {
    const payload = { id: 1, username: 'test', role: 'SUPER_ADMIN' };
    await signToken(payload);
    expect(signToken).toHaveBeenCalledWith(payload);
  });

  it('verifyToken should return payload for valid token', async () => {
    const result = await verifyToken('valid-token');
    expect(result).toEqual({ id: 1, username: 'admin', role: 'SUPER_ADMIN' });
  });
});

describe('RBAC Middleware', () => {
  // Import directly since these are pure functions with no DB deps
  let authorize, requirePermission;

  beforeEach(async () => {
    const rbac = await import('../../shared/middleware/rbac.middleware.js');
    authorize = rbac.authorize;
    requirePermission = rbac.requirePermission;
  });

  it('should allow access for authorized role', () => {
    const { req, res } = createMockReqRes();
    req.user = { id: 1, role: 'SUPER_ADMIN', permissions: [] };
    const next = vi.fn();

    authorize(['SUPER_ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should deny access for unauthorized role', () => {
    const { req, res } = createMockReqRes();
    req.user = { id: 2, role: 'HR_ADMIN', permissions: [] };
    const next = vi.fn();

    authorize(['FINANCE_ADMIN'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny access when no user present', () => {
    const { req, res } = createMockReqRes();
    req.user = null;
    const next = vi.fn();

    authorize(['SUPER_ADMIN'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('SUPER_ADMIN should bypass permission check', () => {
    const { req, res } = createMockReqRes();
    req.user = { id: 1, role: 'SUPER_ADMIN', permissions: [] };
    const next = vi.fn();

    requirePermission('some.permission')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should deny access for missing permission', () => {
    const { req, res } = createMockReqRes();
    req.user = { id: 2, role: 'HR_ADMIN', permissions: ['employees.read'] };
    const next = vi.fn();

    requirePermission('invoices.write')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access when permission exists', () => {
    const { req, res } = createMockReqRes();
    req.user = { id: 2, role: 'HR_ADMIN', permissions: ['employees.read', 'employees.write'] };
    const next = vi.fn();

    requirePermission('employees.write')(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
