-- Add missing columns that cause 500 errors (safe to run multiple times)
-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS locked_by INTEGER;
