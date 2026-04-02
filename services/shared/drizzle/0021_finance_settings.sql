-- Migration: create finance_settings table for global finance configuration
-- Key: opening_cash_balance — the combined KK+KB opening balance for the base period

CREATE TABLE IF NOT EXISTS finance_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMP DEFAULT NOW(),
  updated_by  INTEGER REFERENCES users(id)
);

-- Seed the opening cash balance for January 2026
INSERT INTO finance_settings (key, value, description)
VALUES ('opening_cash_balance', '1081815564.94', 'Saldo awal kas gabungan (KK+KB) per Januari 2026')
ON CONFLICT (key) DO NOTHING;
