-- Add missing columns to clients table (fixes 500 on POST /api/finance/clients)
-- Paste into SQL editor and run. Safe to run multiple times.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS npwp TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pic JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'CUSTOMER';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id TEXT;
