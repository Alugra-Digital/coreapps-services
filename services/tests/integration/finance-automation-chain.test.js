import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Integration tests for the Finance Automation Chain
 * Covers: voucher number generation, kas kecil trans number generation,
 * asset journal code generation, date math, neraca saldo balance logic,
 * and 3-part asset journal trigger condition.
 */

// ── Shared chainable mock db object ─────────────────────────────────────────

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  delete: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  then: vi.fn(),
};

// Make the db object thenable so `.then(rows => rows[0])` works on chain results
Object.defineProperty(mockDb, Symbol.toStringTag, { value: 'MockDB' });

const mockClient = {
  query: vi.fn().mockResolvedValue({ rows: [] }),
  release: vi.fn(),
};

const mockPool = {
  connect: vi.fn().mockResolvedValue(mockClient),
  query: vi.fn().mockResolvedValue({ rows: [] }),
};

// ── DB mock ──────────────────────────────────────────────────────────────────

vi.mock('../../shared/db/index.js', () => ({
  db: mockDb,
  pool: mockPool,
}));

// ── bukuBesarService mock (imported by voucherService & assetAcquisitionJournalService) ──

vi.mock(
  '../../finance-service/src/services/bukuBesarService.js',
  () => ({
    postFromVoucher: vi.fn().mockResolvedValue(undefined),
    postFromAssetJournal: vi.fn().mockResolvedValue(undefined),
  })
);

// ── Service functions: loaded once before all tests ───────────────────────────
// Dynamic imports are slow on first load (drizzle-orm + schema.js).
// Loading them all in parallel in beforeAll avoids per-test timeouts.

let generateVoucherNumber;
let generateTransNumber;
let generateJournalCode;
let generate3PartAssetJournal;
let generateNeracaSaldo;

beforeAll(async () => {
  [
    { generateVoucherNumber },
    { generateTransNumber },
    { generateJournalCode, generate3PartAssetJournal },
    { generateNeracaSaldo },
  ] = await Promise.all([
    import('../../finance-service/src/services/voucherService.js'),
    import('../../finance-service/src/services/kasKecilService.js'),
    import('../../finance-service/src/services/assetAcquisitionJournalService.js'),
    import('../../finance-service/src/services/neracaSaldoService.js'),
  ]);
}, 300000); // 5-minute timeout: module loading is slow when all suite files run concurrently

// ── Helper: reset all mocks and restore default chainable behavior ────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Restore all db methods to return `this` by default
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockReturnThis();
  mockDb.orderBy.mockReturnThis();
  mockDb.insert.mockReturnThis();
  mockDb.values.mockReturnThis();
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  mockDb.delete.mockReturnThis();
  mockDb.leftJoin.mockReturnThis();

  // Default: returning() resolves to []
  mockDb.returning.mockResolvedValue([]);

  // Default: pool query resolves clean
  mockPool.query.mockResolvedValue({ rows: [] });
  mockClient.query.mockResolvedValue({ rows: [] });
  mockClient.release.mockReset();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC1 + TC6(number part): Voucher number generation (voucherService)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC1+TC6: Voucher number generation', () => {
  it('generates VKK/2026/01/001 for first voucher in period (KAS_KECIL)', async () => {
    // Mock db chain: orderBy() (final in chain) resolves to [] — no existing vouchers
    mockDb.orderBy.mockResolvedValue([]);

    const result = await generateVoucherNumber(2026, 1, 'KAS_KECIL');
    expect(result).toBe('VKK/2026/01/001');
  });

  it('increments sequence for second voucher in same period (KAS_KECIL)', async () => {
    // One existing voucher already present
    mockDb.orderBy.mockResolvedValue([{ voucherNumber: 'VKK/2026/01/001' }]);

    const result = await generateVoucherNumber(2026, 1, 'KAS_KECIL');
    expect(result).toBe('VKK/2026/01/002');
  });

  it('resets to 001 for new period (February 2026)', async () => {
    // No vouchers in Feb 2026
    mockDb.orderBy.mockResolvedValue([]);

    const result = await generateVoucherNumber(2026, 2, 'KAS_KECIL');
    expect(result).toBe('VKK/2026/02/001');
  });

  it('generates VKB/2026/01/001 for first KAS_BANK voucher', async () => {
    mockDb.orderBy.mockResolvedValue([]);

    const result = await generateVoucherNumber(2026, 1, 'KAS_BANK');
    expect(result).toBe('VKB/2026/01/001');
  });

  it('correctly handles non-sequential existing numbers (picks max + 1)', async () => {
    // Existing: 001 and 003 (gap) — should produce 004
    mockDb.orderBy.mockResolvedValue([
      { voucherNumber: 'VKK/2026/01/001' },
      { voucherNumber: 'VKK/2026/01/003' },
    ]);

    const result = await generateVoucherNumber(2026, 1, 'KAS_KECIL');
    expect(result).toBe('VKK/2026/01/004');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC2: Kas Kecil trans number generation (kasKecilService)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC2: Kas Kecil trans number generation', () => {
  it('generates KK/2026/01/001 for first entry in period', async () => {
    mockDb.orderBy.mockResolvedValue([]);
    const result = await generateTransNumber(2026, 1);
    expect(result).toBe('KK/2026/01/001');
  });

  it('increments sequence correctly when two entries already exist', async () => {
    mockDb.orderBy.mockResolvedValue([
      { transNumber: 'KK/2026/01/001' },
      { transNumber: 'KK/2026/01/002' },
    ]);
    const result = await generateTransNumber(2026, 1);
    expect(result).toBe('KK/2026/01/003');
  });

  it('pads month to 2 digits (e.g. month 3 → 03)', async () => {
    mockDb.orderBy.mockResolvedValue([]);
    const result = await generateTransNumber(2026, 3);
    expect(result).toBe('KK/2026/03/001');
  });

  it('handles December correctly (month 12)', async () => {
    mockDb.orderBy.mockResolvedValue([{ transNumber: 'KK/2026/12/001' }]);
    const result = await generateTransNumber(2026, 12);
    expect(result).toBe('KK/2026/12/002');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC3: Asset acquisition journal code generation (assetAcquisitionJournalService)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC3: Asset journal code generation', () => {
  it('generates JAA/2026/03/001 for first journal in March 2026', async () => {
    mockDb.orderBy.mockResolvedValue([]);
    const result = await generateJournalCode(2026, 3);
    expect(result).toBe('JAA/2026/03/001');
  });

  it('increments to 002 when JAA/2026/03/001 already exists', async () => {
    mockDb.orderBy.mockResolvedValue([{ journalCode: 'JAA/2026/03/001' }]);
    const result = await generateJournalCode(2026, 3);
    expect(result).toBe('JAA/2026/03/002');
  });

  it('increments to 004 when three journal codes exist (including gaps)', async () => {
    mockDb.orderBy.mockResolvedValue([
      { journalCode: 'JAA/2026/03/001' },
      { journalCode: 'JAA/2026/03/002' },
      { journalCode: 'JAA/2026/03/003' },
    ]);
    const result = await generateJournalCode(2026, 3);
    expect(result).toBe('JAA/2026/03/004');
  });

  it('pads month to 2 digits (month 1 → 01)', async () => {
    mockDb.orderBy.mockResolvedValue([]);
    const result = await generateJournalCode(2026, 1);
    expect(result).toBe('JAA/2026/01/001');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC4: Date math for last day of month (no DB needed)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC4: Last day of month calculation', () => {
  it('January 2026 has 31 days', () => {
    expect(new Date(2026, 1, 0).getDate()).toBe(31);
  });

  it('February 2026 (non-leap year) has 28 days', () => {
    expect(new Date(2026, 2, 0).getDate()).toBe(28);
  });

  it('February 2028 (leap year) has 29 days', () => {
    expect(new Date(2028, 2, 0).getDate()).toBe(29);
  });

  it('December 2026 has 31 days', () => {
    expect(new Date(2026, 12, 0).getDate()).toBe(31);
  });

  it('April 2026 has 30 days', () => {
    expect(new Date(2026, 4, 0).getDate()).toBe(30);
  });

  it('February 2000 (leap year - divisible by 400) has 29 days', () => {
    expect(new Date(2000, 2, 0).getDate()).toBe(29);
  });

  it('February 1900 (not leap - divisible by 100 but not 400) has 28 days', () => {
    expect(new Date(1900, 2, 0).getDate()).toBe(28);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC5: Neraca Saldo balance logic (neracaSaldoService)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC5: Neraca Saldo balance logic', () => {
  /**
   * neracaSaldoService.generateNeracaSaldo(periodId) performs these db calls in order:
   *   1. db.select().from(accounts).orderBy()          → allAccounts
   *   2. db.select().from(bukuBesar).where().orderBy() → bukuBesarEntries
   *   3. db.select().from(accountingPeriods).where()   → [currentPeriod]  (getPreviousPeriod)
   *   4. db.select().from(accountingPeriods).where()   → [previousPeriod] (getPreviousPeriod)
   *   5. db.select().from(neracaSaldo).where().orderBy() → previousNeracaSaldo
   *   6. db.delete(neracaSaldo).where()                → (cleanup)
   *   7. db.insert(neracaSaldo).values()               → (upsert)
   *
   * We use a call-count approach on mockDb.orderBy / mockDb.where to return different
   * values for each sequential call.
   */

  it('returns balanced=true when debits equal credits across all accounts', async () => {
    // Realistic accounts list (COA level-4 entries)
    const mockAccounts = [
      { code: '1110101', name: 'Kas', normalBalance: 'DEBIT', level: 4, parentCode: null },
      { code: '6211305', name: 'Beban Operasional', normalBalance: 'DEBIT', level: 4, parentCode: null },
    ];

    // Buku Besar entries: balanced — 1M debit on Kas, 1M credit on Beban
    const mockBukuBesarEntries = [
      { accountNumber: '1110101', accountName: 'Kas', debit: '1000000', credit: '0', periodId: 1, date: '2026-01-15', id: 1 },
      { accountNumber: '6211305', accountName: 'Beban Operasional', debit: '0', credit: '1000000', periodId: 1, date: '2026-01-15', id: 2 },
    ];

    // Current period
    const mockCurrentPeriod = { id: 1, year: 2026, month: 1, status: 'OPEN' };

    // No previous period (January is the first month here)
    // getPreviousPeriod will query for year=2025 month=12 → returns []

    let orderByCallCount = 0;
    let whereCallCount = 0;

    mockDb.orderBy.mockImplementation(function () {
      orderByCallCount++;
      // Call 1: accounts query → mockAccounts
      if (orderByCallCount === 1) return Promise.resolve(mockAccounts);
      // Call 2: bukuBesar query → mockBukuBesarEntries
      if (orderByCallCount === 2) return Promise.resolve(mockBukuBesarEntries);
      // Call 3: previousNeracaSaldo (getByPeriod for previousPeriod) → []
      if (orderByCallCount === 3) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    mockDb.where.mockImplementation(function () {
      whereCallCount++;
      // Call 1: bukuBesar.where().orderBy() — must return mockDb for chain
      if (whereCallCount === 1) return mockDb;
      // Call 2: currentPeriod lookup in getPreviousPeriod
      if (whereCallCount === 2) return Promise.resolve([mockCurrentPeriod]);
      // Call 3: previousPeriod lookup (Dec 2025) → not found
      if (whereCallCount === 3) return Promise.resolve([]);
      // db.delete is handled by its own per-test mock override below
      return mockDb;
    });

    // delete().where() needs to be awaitable
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    // insert().values() needs to be awaitable
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    });

    const result = await generateNeracaSaldo(1);

    expect(result.balanced).toBe(true);
    expect(result.totalDebit).toBe(result.totalCredit);
    expect(result.totalDebit).toBe(1000000);
    expect(result.entries).toBeDefined();
    expect(result.entries.length).toBeGreaterThan(0);
  });

  it('throws when debits do not equal credits (unbalanced buku besar)', async () => {
    // Unbalanced: 1M debit, only 500K credit
    const mockAccounts = [
      { code: '1110101', name: 'Kas', normalBalance: 'DEBIT', level: 4, parentCode: null },
      { code: '6211305', name: 'Beban Operasional', normalBalance: 'DEBIT', level: 4, parentCode: null },
    ];

    const mockBukuBesarEntries = [
      { accountNumber: '1110101', accountName: 'Kas', debit: '1000000', credit: '0', periodId: 2, date: '2026-01-15', id: 10 },
      { accountNumber: '6211305', accountName: 'Beban Operasional', debit: '0', credit: '500000', periodId: 2, date: '2026-01-15', id: 11 },
    ];

    const mockCurrentPeriod = { id: 2, year: 2026, month: 1, status: 'OPEN' };

    let orderByCallCount = 0;
    let whereCallCount = 0;

    mockDb.orderBy.mockImplementation(function () {
      orderByCallCount++;
      if (orderByCallCount === 1) return Promise.resolve(mockAccounts);
      if (orderByCallCount === 2) return Promise.resolve(mockBukuBesarEntries);
      if (orderByCallCount === 3) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    mockDb.where.mockImplementation(function () {
      whereCallCount++;
      // Call 1: bukuBesar.where().orderBy() — must return mockDb for chain
      if (whereCallCount === 1) return mockDb;
      // Call 2: currentPeriod lookup in getPreviousPeriod
      if (whereCallCount === 2) return Promise.resolve([mockCurrentPeriod]);
      // Call 3: previousPeriod lookup → not found
      if (whereCallCount === 3) return Promise.resolve([]);
      return mockDb;
    });

    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    });

    await expect(generateNeracaSaldo(2)).rejects.toThrow(
      'Trial balance does not balance'
    );
  });

  it('carries forward opening balances from previous period', async () => {
    const mockAccounts = [
      { code: '1110101', name: 'Kas', normalBalance: 'DEBIT', level: 4, parentCode: null },
    ];

    // No new transactions in current period
    const mockBukuBesarEntries = [];

    const mockCurrentPeriod = { id: 3, year: 2026, month: 2, status: 'OPEN' };
    const mockPreviousPeriod = { id: 2, year: 2026, month: 1, status: 'CLOSED' };
    // Previous closing balance for account 1110101 = 500000
    const mockPreviousNeracaSaldo = [
      { accountNumber: '1110101', closingBalance: '500000', periodId: 2 },
    ];

    let orderByCallCount = 0;
    let whereCallCount = 0;

    mockDb.orderBy.mockImplementation(function () {
      orderByCallCount++;
      // Call 1: accounts
      if (orderByCallCount === 1) return Promise.resolve(mockAccounts);
      // Call 2: bukuBesar (empty)
      if (orderByCallCount === 2) return Promise.resolve(mockBukuBesarEntries);
      // Call 3: previousNeracaSaldo entries
      if (orderByCallCount === 3) return Promise.resolve(mockPreviousNeracaSaldo);
      return Promise.resolve([]);
    });

    mockDb.where.mockImplementation(function () {
      whereCallCount++;
      // Call 1: bukuBesar.where().orderBy() — must return mockDb for chain
      if (whereCallCount === 1) return mockDb;
      // Call 2: currentPeriod lookup
      if (whereCallCount === 2) return Promise.resolve([mockCurrentPeriod]);
      // Call 3: previousPeriod lookup (Jan 2026 found)
      if (whereCallCount === 3) return Promise.resolve([mockPreviousPeriod]);
      // Call 4+: neracaSaldo getByPeriod where chain — mockDb for .orderBy()
      return mockDb;
    });

    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    });

    // No transactions in current period → balanced (both debit/credit activity = 0)
    const result = await generateNeracaSaldo(3);

    expect(result.balanced).toBe(true);

    // The carry-forward opening balance logic produced a non-zero closingBalance for the account
    const kasEntry = result.entries.find(e => e.accountNumber === '1110101');
    expect(kasEntry).toBeDefined();
    // Previous period's closingBalance was 500000 (from mockPreviousNeracaSaldo)
    expect(kasEntry.openingBalance).toBe(500000);
    // closingBalance = openingBalance + debit - credit = 500000 + 0 - 0 = 500000
    expect(kasEntry.closingBalance).toBe(500000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC6: 3-Part asset journal trigger condition (assetAcquisitionJournalService)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC6: 3-Part asset journal trigger condition', () => {
  it('returns null when coaAccount is NOT 1240300 and no asset lines', async () => {
    // kasBankTransaction uses a regular bank account — not 1240300
    const mockKasBankTransaction = {
      id: 10,
      transactionCode: 'KB/2026/03/001',
      coaAccount: '1110201', // Kas Bank — not the asset trigger account
      outflow: '5000000',
      inflow: '0',
      description: 'Regular payment',
      date: '2026-03-15',
      periodId: 5,
    };

    // No transaction lines
    const mockKasBankLines = [];

    // Open period
    const mockPeriod = { id: 5, year: 2026, month: 3, status: 'OPEN' };

    let selectCallCount = 0;

    mockDb.select.mockImplementation(function () {
      selectCallCount++;
      return mockDb;
    });

    // We need from().where() to return the right data per call
    let whereCallCount = 0;
    mockDb.where.mockImplementation(function () {
      whereCallCount++;
      // Call 1: kasBankTransactions.where(id) → [mockKasBankTransaction]
      if (whereCallCount === 1) return Promise.resolve([mockKasBankTransaction]);
      // Call 2: accountingPeriods.where(id).then() — must return mockDb for .then() chaining
      if (whereCallCount === 2) return mockDb;
      // Call 3: kasBankTransactionLines.where(kasBankTransactionId) → []
      if (whereCallCount === 3) return Promise.resolve(mockKasBankLines);
      return Promise.resolve([]);
    });

    // accountingPeriods uses .then() chaining: db.select().from().where().then(rows => rows[0])
    // Intercept the thenable for period lookup
    mockDb.then = vi.fn((resolve) => resolve([mockPeriod]));

    const result = await generate3PartAssetJournal(10, 5, 1);
    expect(result).toBeNull();
  });

  it('does NOT return null when coaAccount IS 1240300 (asset account)', async () => {
    // kasBankTransaction uses 1240300 — triggers 3-part journal
    const mockKasBankTransaction = {
      id: 11,
      transactionCode: 'KB/2026/03/002',
      coaAccount: '1240300', // Asset trigger account
      outflow: '13599000',
      inflow: '0',
      description: 'Pembelian aset tetap',
      date: '2026-03-20',
      periodId: 5,
    };

    const mockKasBankLines = [];
    const mockPeriod = { id: 5, year: 2026, month: 3, status: 'OPEN' };

    const mockPart1 = {
      id: 101,
      journalCode: 'JAA/2026/03/001',
      periodId: 5,
      partType: 'PENGAKUAN_ASET',
      debitAccount: '1240300',
      creditAccount: '1250200',
      amount: '13599000',
      status: 'DRAFT',
      assetId: null,
    };
    const mockPart2 = {
      id: 102,
      journalCode: 'JAA/2026/03/002',
      periodId: 5,
      partType: 'PENGAKUAN_HUTANG_ASET',
      debitAccount: '1250200',
      creditAccount: '2110100',
      amount: '13599000',
      status: 'DRAFT',
      assetId: null,
    };
    const mockPart3 = {
      id: 103,
      journalCode: 'JAA/2026/03/003',
      periodId: 5,
      partType: 'PEMBAYARAN_ASET',
      debitAccount: '2110100',
      creditAccount: '1110201',
      amount: '13599000',
      status: 'DRAFT',
      assetId: null,
    };

    // Mock for getById (called at the end to return part1).
    // getById selects { journal: assetAcquisitionJournals, assetName, assetCode }
    // and returns { ...row.journal, assetName, assetCode }, so the raw row must
    // have a nested `journal` property.
    const mockGetByIdResult = {
      journal: {
        id: 1,
        journalCode: 'JAA/2026/03/001',
        partType: 'PENGAKUAN_ASET',
        debitAccount: '1240300',
        creditAccount: '1250200',
        amount: '13599000',
        status: 'DRAFT',
      },
      assetName: null,
      assetCode: null,
    };

    let whereCallCount = 0;
    mockDb.where.mockImplementation(function () {
      whereCallCount++;
      // Call 1: kasBankTransactions lookup → [mockKasBankTransaction]
      if (whereCallCount === 1) return Promise.resolve([mockKasBankTransaction]);
      // Call 2: accountingPeriods.where(id).then() — must return mockDb for .then() chaining
      if (whereCallCount === 2) return mockDb;
      // Call 3: kasBankTransactionLines lookup → []
      if (whereCallCount === 3) return Promise.resolve(mockKasBankLines);
      // Call 4: generateJournalCode — assetAcquisitionJournals where LIKE → mockDb for orderBy chain
      if (whereCallCount === 4) return mockDb;
      // Call 5: getById final call where(and(...)) — returns the joined row
      // (db.update calls go through mockUpdateChain.where, not mockDb.where)
      if (whereCallCount === 5) return Promise.resolve([mockGetByIdResult]);
      return Promise.resolve([]);
    });

    // generateJournalCode orderBy() → []
    let orderByCallCount = 0;
    mockDb.orderBy.mockImplementation(function () {
      orderByCallCount++;
      // Call 1: generateJournalCode → no existing journals
      if (orderByCallCount === 1) return Promise.resolve([]);
      // Call 2: getById leftJoin orderBy — but getById uses a different chain
      return Promise.resolve([mockGetByIdResult]);
    });

    // getById uses leftJoin
    mockDb.leftJoin.mockImplementation(function () {
      return mockDb;
    });

    // Period lookup uses .then() chaining
    mockDb.then = vi.fn((resolve) => resolve([mockPeriod]));

    // db.insert().returning() for each part
    let insertCallCount = 0;
    const mockInsertChain = {
      values: vi.fn().mockImplementation(function () {
        return mockInsertChain;
      }),
      returning: vi.fn().mockImplementation(function () {
        insertCallCount++;
        if (insertCallCount === 1) return Promise.resolve([mockPart1]);
        if (insertCallCount === 2) return Promise.resolve([mockPart2]);
        if (insertCallCount === 3) return Promise.resolve([mockPart3]);
        return Promise.resolve([]);
      }),
    };
    mockDb.insert.mockReturnValue(mockInsertChain);

    // db.update().set().where() chain
    const mockUpdateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    mockDb.update.mockReturnValue(mockUpdateChain);

    // pool.query for advisory lock/unlock
    mockPool.query.mockResolvedValue({ rows: [] });

    // bukuBesarService.postFromAssetJournal is already mocked to resolve successfully

    const result = await generate3PartAssetJournal(11, 5, 1);

    // Should not be null — asset account 1240300 triggers the 3-part journal
    expect(result).not.toBeNull();
    expect(result.journalCode).toBe('JAA/2026/03/001');
    expect(result.partType).toBe('PENGAKUAN_ASET');
    expect(result.debitAccount).toBe('1240300');
    expect(result.creditAccount).toBe('1250200');

    // Advisory lock and unlock should both have been called
    expect(mockPool.query).toHaveBeenCalledWith('SELECT pg_advisory_lock($1)', [5]);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT pg_advisory_unlock($1)', [5]);
  });

  it('returns null when coaAccount is NOT 1240300 and lines have unrelated accounts', async () => {
    const mockKasBankTransaction = {
      id: 12,
      transactionCode: 'KB/2026/03/003',
      coaAccount: '5110100', // General expense — not asset trigger
      outflow: '2500000',
      inflow: '0',
      description: 'Office supplies',
      date: '2026-03-10',
      periodId: 5,
    };

    // Lines also do not reference 1240300 or 1250200
    const mockKasBankLines = [
      { id: 1, kasBankTransactionId: 12, accountNumber: '5110100', debit: '2500000', credit: '0' },
    ];

    const mockPeriod = { id: 5, year: 2026, month: 3, status: 'OPEN' };

    let whereCallCount = 0;
    mockDb.where.mockImplementation(function () {
      whereCallCount++;
      // Call 1: kasBankTransactions.where(id) → [mockKasBankTransaction]
      if (whereCallCount === 1) return Promise.resolve([mockKasBankTransaction]);
      // Call 2: accountingPeriods.where(id).then() — must return mockDb for .then() chaining
      if (whereCallCount === 2) return mockDb;
      // Call 3: kasBankTransactionLines.where(id) → [mockKasBankLines]
      if (whereCallCount === 3) return Promise.resolve(mockKasBankLines);
      return Promise.resolve([]);
    });

    mockDb.then = vi.fn((resolve) => resolve([mockPeriod]));

    const result = await generate3PartAssetJournal(12, 5, 1);
    expect(result).toBeNull();
  });
});
