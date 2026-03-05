-- CoreApps 2.0: Migrate vendors to clients, update purchase_orders, drop vendors

-- Step 1: Add client_id column to purchase_orders (nullable initially)
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);

-- Step 2: Migrate vendor rows into clients (only if vendors table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendors') THEN
    INSERT INTO clients (name, company_name, address, phone, email, npwp, pic, bank_name, bank_account, bank_branch, contact_type, is_active, created_at, updated_at)
    SELECT name, company_name, address, phone, email, npwp, pic, bank_name, bank_account, bank_branch, 'SUPPLIER', is_active, created_at, updated_at
    FROM vendors;
  END IF;
END $$;

-- Step 3: Backfill purchase_orders.client_id by matching supplier_name to clients.company_name
UPDATE purchase_orders po
SET client_id = c.id
FROM clients c
WHERE po.supplier_name = c.company_name
  AND po.client_id IS NULL
  AND c.contact_type = 'SUPPLIER';

-- Step 4: Make supplier_name nullable (client_id is now primary for vendor PO)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'supplier_name'
  ) THEN
    ALTER TABLE purchase_orders ALTER COLUMN supplier_name DROP NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if already nullable or other errors
END $$;

-- Step 5: Drop vendors table
DROP TABLE IF EXISTS vendors;
