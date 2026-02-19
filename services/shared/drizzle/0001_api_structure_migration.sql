-- API Structure Alignment Migration
-- Run this against your PostgreSQL database

-- Add noKk to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS no_kk TEXT;

-- Make ktp optional (for backward compat, existing rows keep values)
ALTER TABLE employees ALTER COLUMN ktp DROP NOT NULL;

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  permission_keys JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add columns to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS npwp TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pic JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  npwp TEXT,
  pic JSONB,
  bank_name TEXT,
  bank_account TEXT,
  bank_branch TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
