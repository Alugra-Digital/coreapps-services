-- Module 6A: Catatan Pengeluaran
-- Tables: accounting_periods, kas_kecil_transactions, kas_bank_transactions,
--         jurnal_memorial, jurnal_memorial_lines

DO $$ BEGIN
  CREATE TYPE "period_status" AS ENUM ('OPEN', 'CLOSED', 'LOCKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "jurnal_memorial_status" AS ENUM ('DRAFT', 'POSTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "accounting_periods" (
  "id"              SERIAL PRIMARY KEY,
  "year"            INTEGER NOT NULL,
  "month"           INTEGER NOT NULL CHECK ("month" BETWEEN 1 AND 12),
  "status"          "period_status" NOT NULL DEFAULT 'OPEN',
  "closed_at"       TIMESTAMP,
  "closed_by"       INTEGER REFERENCES "users"("id"),
  "reopened_at"     TIMESTAMP,
  "reopened_reason" TEXT,
  "created_at"      TIMESTAMP DEFAULT NOW(),
  UNIQUE ("year", "month")
);

CREATE TABLE IF NOT EXISTS "kas_kecil_transactions" (
  "id"              SERIAL PRIMARY KEY,
  "period_id"       INTEGER NOT NULL REFERENCES "accounting_periods"("id"),
  "trans_number"    VARCHAR(50) NOT NULL UNIQUE,
  "date"            DATE NOT NULL,
  "description"     TEXT NOT NULL,
  "debit"           DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "credit"          DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "running_balance" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "attachment_url"  TEXT,
  "created_by"      INTEGER REFERENCES "users"("id"),
  "created_at"      TIMESTAMP DEFAULT NOW(),
  "updated_at"      TIMESTAMP DEFAULT NOW(),
  "deleted_at"      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "kas_bank_transactions" (
  "id"              SERIAL PRIMARY KEY,
  "period_id"       INTEGER NOT NULL REFERENCES "accounting_periods"("id"),
  "trans_number"    VARCHAR(50) NOT NULL UNIQUE,
  "date"            DATE NOT NULL,
  "coa_account"     VARCHAR(30) NOT NULL,
  "description"     TEXT NOT NULL,
  "inflow"          DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "outflow"         DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "running_balance" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "reference"       VARCHAR(100),
  "created_by"      INTEGER REFERENCES "users"("id"),
  "created_at"      TIMESTAMP DEFAULT NOW(),
  "updated_at"      TIMESTAMP DEFAULT NOW(),
  "deleted_at"      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "jurnal_memorial" (
  "id"           SERIAL PRIMARY KEY,
  "period_id"    INTEGER NOT NULL REFERENCES "accounting_periods"("id"),
  "journal_code" VARCHAR(50) NOT NULL UNIQUE,
  "date"         DATE NOT NULL,
  "description"  TEXT NOT NULL,
  "status"       "jurnal_memorial_status" NOT NULL DEFAULT 'DRAFT',
  "created_by"   INTEGER REFERENCES "users"("id"),
  "created_at"   TIMESTAMP DEFAULT NOW(),
  "updated_at"   TIMESTAMP DEFAULT NOW(),
  "deleted_at"   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "jurnal_memorial_lines" (
  "id"                 SERIAL PRIMARY KEY,
  "jurnal_memorial_id" INTEGER NOT NULL REFERENCES "jurnal_memorial"("id") ON DELETE CASCADE,
  "account_number"     VARCHAR(30) NOT NULL,
  "account_name"       VARCHAR(200) NOT NULL,
  "debit"              DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "credit"             DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "line_description"   TEXT
);

CREATE INDEX IF NOT EXISTS idx_kas_kecil_period ON "kas_kecil_transactions"("period_id");
CREATE INDEX IF NOT EXISTS idx_kas_kecil_date ON "kas_kecil_transactions"("date");
CREATE INDEX IF NOT EXISTS idx_kas_bank_period ON "kas_bank_transactions"("period_id");
CREATE INDEX IF NOT EXISTS idx_kas_bank_date ON "kas_bank_transactions"("date");
CREATE INDEX IF NOT EXISTS idx_jurnal_memorial_period ON "jurnal_memorial"("period_id");
