/**
 * Shared test utilities for CoreApps ERP microservices.
 * Provides mock database, JWT token generators, and RBAC test helpers.
 */
import { vi } from 'vitest';
import { SignJWT } from 'jose';

// ─── JWT Test Helpers ───────────────────────────────────────────────────────
const TEST_JWT_SECRET = new TextEncoder().encode('test-jwt-secret-for-unit-tests');

/**
 * Generate a valid JWT token for testing
 * @param {object} payload - Token payload (id, username, role)
 * @param {string} [expiresIn='24h'] - Token expiration
 * @returns {Promise<string>} JWT token
 */
export async function generateTestToken(payload = {}, expiresIn = '24h') {
  const defaults = {
    id: 1,
    username: 'testadmin',
    role: 'SUPER_ADMIN',
  };

  return await new SignJWT({ ...defaults, ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(TEST_JWT_SECRET);
}

/**
 * Generate tokens for different roles
 */
export async function generateRoleTokens() {
  return {
    superAdmin: await generateTestToken({ id: 1, username: 'superadmin', role: 'SUPER_ADMIN' }),
    hrAdmin: await generateTestToken({ id: 2, username: 'hradmin', role: 'HR_ADMIN' }),
    financeAdmin: await generateTestToken({ id: 3, username: 'financeadmin', role: 'FINANCE_ADMIN' }),
  };
}

// ─── Mock Database ──────────────────────────────────────────────────────────

/**
 * Create a mock database object that mimics Drizzle ORM's API
 */
export function createMockDb() {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue([]),
  };

  const db = {
    select: vi.fn().mockReturnValue(mockChain),
    insert: vi.fn().mockReturnValue(mockChain),
    update: vi.fn().mockReturnValue(mockChain),
    delete: vi.fn().mockReturnValue(mockChain),
    execute: vi.fn().mockResolvedValue([]),
    transaction: vi.fn(async (fn) => fn(db)),
  };

  return { db, mockChain };
}

// ─── Request Helpers ────────────────────────────────────────────────────────

/**
 * Create authorization header
 * @param {string} token - JWT token
 * @returns {object} Headers object
 */
export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Test Data Factories ────────────────────────────────────────────────────

let idCounter = 100;

export function createTestEmployee(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    nik: `EMP${String(idCounter).padStart(3, '0')}`,
    name: `Test Employee ${idCounter}`,
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
    ...overrides,
  };
}

export function createTestClient(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    name: `Test Client ${idCounter}`,
    address: 'Jl. Test No. 123, Jakarta',
    email: `client${idCounter}@test.com`,
    phone: '081234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestInvoice(overrides = {}) {
  idCounter++;
  const subtotal = overrides.subtotal || '10000000';
  const ppn = String(Number(subtotal) * 0.11);
  const pph = overrides.pph || '0';
  const grandTotal = String(Number(subtotal) + Number(ppn) - Number(pph));

  return {
    id: idCounter,
    number: `INV/2026/02/${String(idCounter).padStart(3, '0')}`,
    quotationId: null,
    clientId: 1,
    date: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [{ description: 'Test Service', qty: 1, unitPrice: subtotal }],
    subtotal,
    ppn,
    pph,
    grandTotal,
    status: 'DRAFT',
    pdfLocked: false,
    revisionNumber: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestQuotation(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    number: `QT/2026/02/${String(idCounter).padStart(3, '0')}`,
    clientId: 1,
    date: new Date(),
    items: [{ description: 'Consulting Services', qty: 10, unitPrice: '1000000' }],
    subtotal: '10000000',
    ppn: '1100000',
    grandTotal: '11100000',
    scopeOfWork: 'Test scope of work',
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestLead(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    name: `Test Lead ${idCounter}`,
    company: `Company ${idCounter}`,
    email: `lead${idCounter}@test.com`,
    phone: '081234567890',
    status: 'NEW',
    source: 'Website',
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestOpportunity(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    name: `Opportunity ${idCounter}`,
    leadId: 1,
    clientId: null,
    amount: '50000000',
    probability: 50,
    stage: 'PROSPECTING',
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    notes: 'Test opportunity',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestAccount(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    code: `${1000 + idCounter}`,
    name: `Test Account ${idCounter}`,
    type: 'ASSET',
    description: 'Test account',
    balance: '0',
    isGroup: false,
    parentAccountId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestJournalEntry(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    date: new Date(),
    description: 'Test journal entry',
    reference: `JE-TEST-${idCounter}`,
    status: 'DRAFT',
    totalDebit: '1000000',
    totalCredit: '1000000',
    createdAt: new Date(),
    updatedAt: new Date(),
    postedAt: null,
    ...overrides,
  };
}

export function createTestUser(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    username: `user${idCounter}`,
    password: '$2a$10$hashedpassword', // bcrypt hash placeholder
    role: 'SUPER_ADMIN',
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Reset ──────────────────────────────────────────────────────────────────

export function resetIdCounter() {
  idCounter = 100;
}
