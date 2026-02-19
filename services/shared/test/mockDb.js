/**
 * Mock Database module for unit testing.
 * 
 * Usage in vitest:
 *   vi.mock('../../../shared/db/index.js', () => import('../../../shared/test/mockDb.js'));
 * 
 * Then in tests:
 *   import { __mockDb, __resetMocks } from '../../../shared/test/mockDb.js';
 */
import { vi } from 'vitest';

// Internal storage for mock results
let mockSelectResult = [];
let mockInsertResult = [];
let mockUpdateResult = [];
let mockDeleteResult = [];

// Chainable mock object
const createChain = (resultGetter) => {
  const chain = {
    from: vi.fn().mockImplementation(() => chain),
    where: vi.fn().mockImplementation(() => chain),
    innerJoin: vi.fn().mockImplementation(() => chain),
    leftJoin: vi.fn().mockImplementation(() => chain),
    rightJoin: vi.fn().mockImplementation(() => chain),
    orderBy: vi.fn().mockImplementation(() => chain),
    groupBy: vi.fn().mockImplementation(() => chain),
    having: vi.fn().mockImplementation(() => chain),
    limit: vi.fn().mockImplementation(() => chain),
    offset: vi.fn().mockImplementation(() => chain),
    values: vi.fn().mockImplementation(() => chain),
    set: vi.fn().mockImplementation(() => chain),
    returning: vi.fn().mockImplementation(() => Promise.resolve(resultGetter())),
    then: vi.fn().mockImplementation((resolve) => resolve(resultGetter())),
    [Symbol.asyncIterator]: vi.fn(),
  };

  // Make the chain thenable (so `await db.select()...` works)
  chain.then = (resolve, reject) => {
    try {
      return Promise.resolve(resultGetter()).then(resolve, reject);
    } catch (e) {
      return reject ? reject(e) : Promise.reject(e);
    }
  };

  return chain;
};

const selectChain = createChain(() => mockSelectResult);
const insertChain = createChain(() => mockInsertResult);
const updateChain = createChain(() => mockUpdateResult);
const deleteChain = createChain(() => mockDeleteResult);

export const db = {
  select: vi.fn().mockImplementation(() => selectChain),
  insert: vi.fn().mockImplementation(() => insertChain),
  update: vi.fn().mockImplementation(() => updateChain),
  delete: vi.fn().mockImplementation(() => deleteChain),
  execute: vi.fn().mockResolvedValue([]),
  transaction: vi.fn(async (fn) => {
    return fn(db);
  }),
};

// ─── Test Control API ───────────────────────────────────────────────────────

/**
 * Set the result that will be returned by the next select query
 */
export function __setSelectResult(result) {
  mockSelectResult = result;
}

/**
 * Set the result that will be returned by the next insert query
 */
export function __setInsertResult(result) {
  mockInsertResult = result;
}

/**
 * Set the result that will be returned by the next update query
 */
export function __setUpdateResult(result) {
  mockUpdateResult = result;
}

/**
 * Set the result that will be returned by the next delete query
 */
export function __setDeleteResult(result) {
  mockDeleteResult = result;
}

/**
 * Reset all mocks and results
 */
export function __resetMocks() {
  mockSelectResult = [];
  mockInsertResult = [];
  mockUpdateResult = [];
  mockDeleteResult = [];
  vi.clearAllMocks();
}

/**
 * Get the mock db for direct manipulation
 */
export const __mockDb = db;
