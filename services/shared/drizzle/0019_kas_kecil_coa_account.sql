-- Add coa_account column to kas_kecil_transactions for double-entry voucher generation
ALTER TABLE "kas_kecil_transactions"
  ADD COLUMN IF NOT EXISTS "coa_account" VARCHAR(30);
