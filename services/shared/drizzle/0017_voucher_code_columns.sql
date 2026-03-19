-- Migration 0017: Add voucher_code columns to Kas Kecil and Kas Bank transactions
-- This migration adds support for manual voucher codes that can be edited by users
-- The voucher codes are validated for uniqueness within the same accounting period

-- ============================================
-- 1. Add voucher_code column to kas_kecil_transactions
-- ============================================

DO $$
BEGIN
  ALTER TABLE kas_kecil_transactions ADD COLUMN voucher_code VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- ============================================
-- 2. Add voucher_code column to kas_bank_transactions
-- ============================================

DO $$
BEGIN
  ALTER TABLE kas_bank_transactions ADD COLUMN voucher_code VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- ============================================
-- Migration complete
-- ============================================
