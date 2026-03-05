-- CoreApps 2.0: Alter existing tables - invoices, basts, proposal_penawaran, quotations, purchase_orders

-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS termin_id INTEGER REFERENCES project_termins(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_purchase_order_id INTEGER REFERENCES client_purchase_orders(id);

-- basts
ALTER TABLE basts ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
ALTER TABLE basts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT';
ALTER TABLE basts ADD COLUMN IF NOT EXISTS linked_invoice_ids JSONB DEFAULT '[]';

-- proposal_penawaran
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1';
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS parent_proposal_id INTEGER REFERENCES proposal_penawaran(id);
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS prepared_by_id INTEGER REFERENCES employees(id);
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
ALTER TABLE proposal_penawaran ADD COLUMN IF NOT EXISTS sent_to TEXT;

-- quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);

-- purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
