-- Module 6C: Laporan dan Jurnal Aset
-- Extends assets table, adds asset_acquisition_journals, adds period_id to asset_depreciations

-- ── New enum ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "asset_journal_status" AS ENUM ('DRAFT', 'POSTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Extend assets table ───────────────────────────────────────────────────────
ALTER TABLE "assets"
  ADD COLUMN IF NOT EXISTS "asset_code"                         VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS "useful_life_months"                 INTEGER,
  ADD COLUMN IF NOT EXISTS "salvage_value"                      DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "department"                         VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "vendor"                             VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "attachment_url"                     TEXT,
  ADD COLUMN IF NOT EXISTS "coa_asset_account"                  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "coa_depreciation_expense_account"   VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "coa_accumulated_depreciation_account" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "deleted_at"                         TIMESTAMP;

-- ── Extend asset_depreciations table ─────────────────────────────────────────
ALTER TABLE "asset_depreciations"
  ADD COLUMN IF NOT EXISTS "period_id"    INTEGER REFERENCES "accounting_periods"("id"),
  ADD COLUMN IF NOT EXISTS "status"       "asset_journal_status" DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "description"  TEXT;

CREATE INDEX IF NOT EXISTS idx_asset_depreciations_period ON "asset_depreciations"("period_id");
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_depreciations_period_asset
  ON "asset_depreciations"("period_id", "asset_id")
  WHERE "period_id" IS NOT NULL;

-- ── New table: asset_acquisition_journals (Jurnal Memori Aset) ────────────────
CREATE TABLE IF NOT EXISTS "asset_acquisition_journals" (
  "id"                    SERIAL PRIMARY KEY,
  "period_id"             INTEGER NOT NULL REFERENCES "accounting_periods"("id"),
  "asset_id"              INTEGER NOT NULL REFERENCES "assets"("id"),
  "journal_code"          VARCHAR(50) NOT NULL UNIQUE,
  "date"                  DATE NOT NULL,
  "description"           TEXT NOT NULL,
  "debit_account"         VARCHAR(30) NOT NULL,
  "debit_account_name"    VARCHAR(200) NOT NULL,
  "credit_account"        VARCHAR(30) NOT NULL,
  "credit_account_name"   VARCHAR(200) NOT NULL,
  "amount"                DECIMAL(15, 2) NOT NULL,
  "notes"                 TEXT,
  "status"                "asset_journal_status" NOT NULL DEFAULT 'DRAFT',
  "journal_entry_id"      INTEGER REFERENCES "journal_entries"("id"),
  "created_by"            INTEGER REFERENCES "users"("id"),
  "created_at"            TIMESTAMP DEFAULT NOW(),
  "updated_at"            TIMESTAMP DEFAULT NOW(),
  "deleted_at"            TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_acq_journals_period ON "asset_acquisition_journals"("period_id");
CREATE INDEX IF NOT EXISTS idx_asset_acq_journals_asset  ON "asset_acquisition_journals"("asset_id");
