-- Add profile columns, organization_settings, and finance_transactions
-- Usage: psql $DB_URL -f services/shared/drizzle/0006_profile_settings.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

DO $$ BEGIN
  CREATE TYPE finance_transaction_type AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE finance_transaction_status AS ENUM ('Completed', 'Pending', 'Processing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS finance_transactions (
  id SERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  entity TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  type finance_transaction_type NOT NULL,
  status finance_transaction_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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
