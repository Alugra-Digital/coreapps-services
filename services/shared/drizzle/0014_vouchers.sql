-- Module 6B: Voucher
-- Tables: vouchers, voucher_lines

DO $$ BEGIN
  CREATE TYPE "voucher_type" AS ENUM ('KAS_KECIL', 'KAS_BANK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "voucher_status" AS ENUM (
    'DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "vouchers" (
  "id"               SERIAL PRIMARY KEY,
  "period_id"        INTEGER NOT NULL REFERENCES "accounting_periods"("id"),
  "voucher_number"   VARCHAR(50) NOT NULL UNIQUE,
  "voucher_type"     "voucher_type" NOT NULL,
  "date"             DATE NOT NULL,
  "payee"            VARCHAR(200) NOT NULL,
  "description"      TEXT NOT NULL,
  "total_amount"     DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "payment_method"   VARCHAR(50),
  "prepared_by"      INTEGER REFERENCES "users"("id"),
  "reviewed_by"      INTEGER REFERENCES "users"("id"),
  "approved_by"      INTEGER REFERENCES "users"("id"),
  "received_by"      VARCHAR(200),
  "status"           "voucher_status" NOT NULL DEFAULT 'DRAFT',
  "reviewed_at"      TIMESTAMP,
  "approved_at"      TIMESTAMP,
  "paid_at"          TIMESTAMP,
  "rejection_reason" TEXT,
  "attachment_url"   TEXT,
  "created_by"       INTEGER REFERENCES "users"("id"),
  "created_at"       TIMESTAMP DEFAULT NOW(),
  "updated_at"       TIMESTAMP DEFAULT NOW(),
  "deleted_at"       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "voucher_lines" (
  "id"             SERIAL PRIMARY KEY,
  "voucher_id"     INTEGER NOT NULL REFERENCES "vouchers"("id") ON DELETE CASCADE,
  "account_number" VARCHAR(30) NOT NULL,
  "account_name"   VARCHAR(200) NOT NULL,
  "description"    TEXT,
  "debit"          DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "credit"         DECIMAL(15, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vouchers_period ON "vouchers"("period_id");
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON "vouchers"("voucher_type");
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON "vouchers"("status");
CREATE INDEX IF NOT EXISTS idx_voucher_lines_voucher ON "voucher_lines"("voucher_id");
