-- Module 6 new tables migration
-- Safe to run multiple times (uses IF NOT EXISTS / EXCEPTION WHEN duplicate_object)
-- Tables: accounting_periods, kas_kecil_transactions, kas_bank_transactions,
--         jurnal_memorial, jurnal_memorial_lines, vouchers, voucher_lines,
--         asset_acquisition_journals

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE period_status AS ENUM ('OPEN', 'CLOSED', 'LOCKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE jurnal_memorial_status AS ENUM ('DRAFT', 'POSTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE voucher_type AS ENUM ('KAS_KECIL', 'KAS_BANK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE voucher_status AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_journal_status AS ENUM ('DRAFT', 'POSTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. accounting_periods
-- =============================================================================

CREATE TABLE IF NOT EXISTS accounting_periods (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  status period_status NOT NULL DEFAULT 'OPEN',
  closed_at TIMESTAMP,
  closed_by INTEGER REFERENCES users(id),
  reopened_at TIMESTAMP,
  reopened_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (year, month)
);

-- =============================================================================
-- 3. kas_kecil_transactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS kas_kecil_transactions (
  id SERIAL PRIMARY KEY,
  period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
  trans_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  running_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  attachment_url TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =============================================================================
-- 4. kas_bank_transactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS kas_bank_transactions (
  id SERIAL PRIMARY KEY,
  period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
  trans_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  coa_account VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  inflow NUMERIC(15, 2) NOT NULL DEFAULT 0,
  outflow NUMERIC(15, 2) NOT NULL DEFAULT 0,
  running_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  reference VARCHAR(100),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =============================================================================
-- 5. jurnal_memorial
-- =============================================================================

CREATE TABLE IF NOT EXISTS jurnal_memorial (
  id SERIAL PRIMARY KEY,
  period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
  journal_code VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  status jurnal_memorial_status NOT NULL DEFAULT 'DRAFT',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =============================================================================
-- 6. jurnal_memorial_lines
-- =============================================================================

CREATE TABLE IF NOT EXISTS jurnal_memorial_lines (
  id SERIAL PRIMARY KEY,
  jurnal_memorial_id INTEGER NOT NULL REFERENCES jurnal_memorial(id),
  account_number VARCHAR(30) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  line_description TEXT
);

-- =============================================================================
-- 7. vouchers
-- =============================================================================

CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
  voucher_number VARCHAR(50) NOT NULL UNIQUE,
  voucher_type voucher_type NOT NULL,
  date DATE NOT NULL,
  payee VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  prepared_by INTEGER REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  received_by VARCHAR(200),
  status voucher_status NOT NULL DEFAULT 'DRAFT',
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  rejection_reason TEXT,
  attachment_url TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =============================================================================
-- 8. voucher_lines
-- =============================================================================

CREATE TABLE IF NOT EXISTS voucher_lines (
  id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES vouchers(id),
  account_number VARCHAR(30) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  description TEXT,
  debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(15, 2) NOT NULL DEFAULT 0
);

-- =============================================================================
-- 9. asset_acquisition_journals
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_acquisition_journals (
  id SERIAL PRIMARY KEY,
  period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  journal_code VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  debit_account VARCHAR(30) NOT NULL,
  debit_account_name VARCHAR(200) NOT NULL,
  credit_account VARCHAR(30) NOT NULL,
  credit_account_name VARCHAR(200) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  notes TEXT,
  status asset_journal_status NOT NULL DEFAULT 'DRAFT',
  journal_entry_id INTEGER REFERENCES journal_entries(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =============================================================================
-- 10. Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_kas_kecil_period ON kas_kecil_transactions(period_id);
CREATE INDEX IF NOT EXISTS idx_kas_bank_period ON kas_bank_transactions(period_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_memorial_period ON jurnal_memorial(period_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_period ON vouchers(period_id);
CREATE INDEX IF NOT EXISTS idx_asset_acq_journals_period ON asset_acquisition_journals(period_id);
