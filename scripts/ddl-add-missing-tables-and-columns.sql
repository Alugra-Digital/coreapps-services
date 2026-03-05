-- Add missing tables and columns to match schema.js and app requirements
-- Run in SQL editor. Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS for columns).
-- Owner statements omitted for portability; add "ALTER TABLE ... OWNER TO pgadmin" if needed.

-- =============================================================================
-- 1. MISSING ENUMS
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE finance_transaction_type AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE finance_transaction_status AS ENUM ('Completed', 'Pending', 'Processing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_type AS ENUM ('financial', 'inventory', 'hr', 'sales', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. MISSING COLUMNS ON EXISTING TABLES
-- =============================================================================

-- clients (fixes 500 on POST /api/finance/clients)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS npwp TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pic JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'CUSTOMER';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- users (profile/settings)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- vendors (finance vendor API)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS npwp TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pic JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_branch TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- Backfill company_name from name for existing rows
UPDATE vendors SET company_name = COALESCE(company_name, name) WHERE company_name IS NULL AND name IS NOT NULL;

-- salary_slips
ALTER TABLE salary_slips ADD COLUMN IF NOT EXISTS pph21 NUMERIC DEFAULT 0;
ALTER TABLE salary_slips ADD COLUMN IF NOT EXISTS loan_repayment NUMERIC DEFAULT 0;

-- salary_structures
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;

-- products (created_at, updated_at if missing)
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- warehouses (updated_at if missing)
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- =============================================================================
-- 3. MISSING TABLES
-- =============================================================================

-- organization_settings (settings API, auth-service)
CREATE TABLE IF NOT EXISTS organization_settings (
  id SERIAL PRIMARY KEY,
  company_name TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_website TEXT,
  timezone TEXT DEFAULT 'Asia/Jakarta',
  currency TEXT DEFAULT 'IDR',
  date_format TEXT DEFAULT 'dd-mm-yyyy',
  theme TEXT DEFAULT 'system',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  two_factor_auth BOOLEAN DEFAULT false,
  session_timeout TEXT DEFAULT '30m',
  auto_assign_approver BOOLEAN DEFAULT true,
  daily_backup BOOLEAN DEFAULT true,
  soft_delete BOOLEAN DEFAULT true,
  compact_mode BOOLEAN DEFAULT false,
  default_approval_flow TEXT DEFAULT 'sequential',
  escalation_sla TEXT DEFAULT '24h',
  retention_period TEXT DEFAULT '365d',
  billing_email TEXT,
  current_plan TEXT DEFAULT 'enterprise',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- finance_transactions (finance overview/transactions API)
CREATE TABLE IF NOT EXISTS finance_transactions (
  id SERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  entity TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type finance_transaction_type NOT NULL,
  status finance_transaction_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- report_templates (reports module)
CREATE TABLE IF NOT EXISTS report_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type report_type NOT NULL,
  query JSONB NOT NULL,
  filters JSONB,
  columns JSONB NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- report_schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES report_templates(id),
  frequency report_frequency NOT NULL,
  recipients JSONB NOT NULL,
  last_run TIMESTAMP,
  next_run TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- generated_reports
CREATE TABLE IF NOT EXISTS generated_reports (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES report_templates(id),
  data JSONB NOT NULL,
  filters JSONB,
  generated_by INTEGER REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW(),
  file_url VARCHAR(500)
);

-- dashboard_widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  config JSONB NOT NULL,
  data_source VARCHAR(100) NOT NULL,
  refresh_interval INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- dashboard_layouts
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  layout JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- custom_kpis
CREATE TABLE IF NOT EXISTS custom_kpis (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  formula TEXT NOT NULL,
  data_source JSONB NOT NULL,
  threshold JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
