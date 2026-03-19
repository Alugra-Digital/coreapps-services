-- Fix missing columns in assets table
-- This migration adds asset_code and other missing columns to the assets table

-- Add missing columns to assets table
ALTER TABLE "assets"
  ADD COLUMN IF NOT EXISTS "asset_code" VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS "asset_type_code" VARCHAR(10) REFERENCES "asset_types"("code"),
  ADD COLUMN IF NOT EXISTS "specification" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "useful_life_months" INTEGER,
  ADD COLUMN IF NOT EXISTS "salvage_value" DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "department" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "vendor" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "attachment_url" TEXT,
  ADD COLUMN IF NOT EXISTS "coa_asset_account" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "coa_depreciation_expense_account" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "coa_accumulated_depreciation_account" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;

-- Add foreign key constraint for asset_type_code if it doesn't exist
DO $$
BEGIN
  ALTER TABLE "assets"
  ADD CONSTRAINT "assets_asset_type_code_asset_types_code_fk"
  FOREIGN KEY ("asset_type_code") REFERENCES "asset_types"("code")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
