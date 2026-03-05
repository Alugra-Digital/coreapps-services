-- CoreApps 2.0: Extend clients table for supplier role (Vendor removal prep)
-- Client can serve as both CUSTOMER and SUPPLIER (contact_type)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'CUSTOMER';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_branch TEXT;
