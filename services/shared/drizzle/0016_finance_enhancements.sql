-- Migration 0016: Finance Module Enhancements for Requirement 2.0
-- This migration adds support for:
-- - Period management with opening balances and numbering sequences
-- - Kas Kecil/Kas Bank transaction codes and compound entries
-- - Voucher workflow with auto-generation tracking
-- - 3-part Jurnal Memori Aset
-- - Jurnal Penyusutan with month/year tracking
-- - Buku Besar and Neraca Saldo tables
-- - Cash reconciliation for Kas Kecil

-- ============================================
-- 1. Add enum for asset journal part type
-- ============================================

DO $$ BEGIN
  CREATE TYPE asset_journal_part_type AS ENUM (
      'PENGAKUAN_ASET',        -- Part 1: Asset recognition
      'PENGAKUAN_HUTANG_ASET',  -- Part 2: Liability recognition
      'PEMBAYARAN_ASET'        -- Part 3: Asset payment
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. Enhance accounting_periods table
-- ============================================

DO $$
BEGIN
  ALTER TABLE accounting_periods ADD COLUMN period_opening_balances JSONB DEFAULT '{}';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE accounting_periods ADD COLUMN kk_sequence INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE accounting_periods ADD COLUMN km_sequence INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE accounting_periods ADD COLUMN bk_sequence INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE accounting_periods ADD COLUMN bm_sequence INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE accounting_periods ADD COLUMN jm_sequence INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- ============================================
-- 3. Enhance kas_kecil_transactions table
-- ============================================

DO $$
BEGIN
  ALTER TABLE kas_kecil_transactions ADD COLUMN transaction_code VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE kas_kecil_transactions ADD COLUMN opening_balance NUMERIC(15,2) DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add unique constraint for transaction_code
DO $$
BEGIN
  ALTER TABLE kas_kecil_transactions ADD CONSTRAINT kas_kecil_transactions_transaction_code_key UNIQUE (transaction_code);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Migrate existing transNumber to transaction_code if transaction_code is null
UPDATE kas_kecil_transactions
SET transaction_code = trans_number
WHERE transaction_code IS NULL;

-- ============================================
-- 4. Enhance kas_bank_transactions table
-- ============================================

DO $$
BEGIN
  ALTER TABLE kas_bank_transactions ADD COLUMN transaction_code VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE kas_bank_transactions ADD COLUMN opening_balance NUMERIC(15,2) DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add unique constraint for transaction_code
DO $$
BEGIN
  ALTER TABLE kas_bank_transactions ADD CONSTRAINT kas_bank_transactions_transaction_code_key UNIQUE (transaction_code);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Migrate existing transNumber to transaction_code if transaction_code is null
UPDATE kas_bank_transactions
SET transaction_code = trans_number
WHERE transaction_code IS NULL;

-- ============================================
-- 5. Add kas_bank_transaction_lines table for compound entries
-- ============================================

CREATE TABLE IF NOT EXISTS kas_bank_transaction_lines (
    id SERIAL PRIMARY KEY,
    kas_bank_transaction_id INTEGER NOT NULL REFERENCES kas_bank_transactions(id) ON DELETE CASCADE,
    account_number VARCHAR(30) NOT NULL,
    account_name VARCHAR(200),
    debit NUMERIC(15,2) NOT NULL DEFAULT 0,
    credit NUMERIC(15,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. Enhance vouchers table
-- ============================================

DO $$
BEGIN
  ALTER TABLE vouchers ADD COLUMN source_type VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE vouchers ADD COLUMN source_id INTEGER;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE vouchers ADD COLUMN workflow_log JSONB DEFAULT '[]';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- ============================================
-- 7. Enhance asset_acquisition_journals table
-- ============================================

DO $$
BEGIN
  ALTER TABLE asset_acquisition_journals ADD COLUMN part_type asset_journal_part_type;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE asset_acquisition_journals ADD COLUMN parent_transaction_id INTEGER;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- ============================================
-- 8. Enhance asset_depreciations table
-- ============================================

DO $$
BEGIN
  ALTER TABLE asset_depreciations ADD COLUMN month INTEGER NOT NULL DEFAULT 1;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE asset_depreciations ADD COLUMN year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW());
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE asset_depreciations ADD COLUMN journal_code VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- ============================================
-- 9. Create cash_reconciliations table
-- ============================================

CREATE TABLE IF NOT EXISTS cash_reconciliations (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
    kas_kecil_transaction_id INTEGER REFERENCES kas_kecil_transactions(id),

    -- Uang Kertas (Paper Money)
    paper_100000_qty INTEGER DEFAULT 0,
    paper_50000_qty INTEGER DEFAULT 0,
    paper_20000_qty INTEGER DEFAULT 0,
    paper_10000_qty INTEGER DEFAULT 0,
    paper_5000_qty INTEGER DEFAULT 0,
    paper_2000_qty INTEGER DEFAULT 0,
    paper_1000_qty INTEGER DEFAULT 0,

    -- Uang Logam (Coins)
    coin_1000_qty INTEGER DEFAULT 0,
    coin_500_qty INTEGER DEFAULT 0,
    coin_200_qty INTEGER DEFAULT 0,
    coin_100_qty INTEGER DEFAULT 0,

    -- Calculated totals
    total_physical NUMERIC(15,2) DEFAULT 0,
    system_balance NUMERIC(15,2) DEFAULT 0,
    difference NUMERIC(15,2) DEFAULT 0,

    -- Metadata
    notes TEXT,
    reconciled_by INTEGER REFERENCES users(id),
    reconciled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. Create buku_besar table (General Ledger)
-- ============================================

CREATE TABLE IF NOT EXISTS buku_besar (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
    account_number VARCHAR(30) NOT NULL,
    account_name VARCHAR(200),

    -- Reference to source document
    voucher_number VARCHAR(50),
    journal_code VARCHAR(50),
    kas_kecil_code VARCHAR(50),
    kas_bank_code VARCHAR(50),
    source_type VARCHAR(50),  -- 'VOUCHER', 'JOURNAL', 'KK', 'KB', etc.
    source_id INTEGER,

    date DATE NOT NULL,
    debit NUMERIC(15,2) NOT NULL DEFAULT 0,
    credit NUMERIC(15,2) NOT NULL DEFAULT 0,

    -- Running balance for this account
    running_balance NUMERIC(15,2) DEFAULT 0,

    -- Opening balance marker (for carry-forward rows)
    is_opening_balance BOOLEAN DEFAULT FALSE,
    opening_balance NUMERIC(15,2) DEFAULT 0,

    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 11. Create neraca_saldo table (Trial Balance)
-- ============================================

CREATE TABLE IF NOT EXISTS neraca_saldo (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES accounting_periods(id),

    -- Account hierarchy
    account_number VARCHAR(30) NOT NULL,
    account_name VARCHAR(200),
    account_level INTEGER DEFAULT 4,  -- 1=Group, 2=Sub-Group, 3=Sub-Sub-Group, 4=Detail
    parent_account_number VARCHAR(30),
    normal_balance VARCHAR(10),  -- 'DEBIT' or 'CREDIT'

    -- Balances
    opening_balance NUMERIC(15,2) DEFAULT 0,
    debit NUMERIC(15,2) DEFAULT 0,
    credit NUMERIC(15,2) DEFAULT 0,
    closing_balance NUMERIC(15,2) DEFAULT 0,

    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 12. Create indexes for performance
-- ============================================

-- Index for buku_besar
CREATE INDEX IF NOT EXISTS idx_buku_besar_period_account ON buku_besar(period_id, account_number);
CREATE INDEX IF NOT EXISTS idx_buku_besar_date ON buku_besar(date);
CREATE INDEX IF NOT EXISTS idx_buku_besar_source ON buku_besar(source_type, source_id);

-- Index for neraca_saldo
CREATE INDEX IF NOT EXISTS idx_neraca_saldo_period ON neraca_saldo(period_id);
CREATE INDEX IF NOT EXISTS idx_neraca_saldo_account ON neraca_saldo(account_number);

-- Index for cash_reconciliations
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_period ON cash_reconciliations(period_id);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_transaction ON cash_reconciliations(kas_kecil_transaction_id);

-- Index for asset_acquisition_journals
CREATE INDEX IF NOT EXISTS idx_asset_acquisition_journals_parent ON asset_acquisition_journals(parent_transaction_id);
CREATE INDEX IF NOT EXISTS idx_asset_acquisition_journals_part_type ON asset_acquisition_journals(part_type);

-- ============================================
-- Migration complete
-- ============================================
