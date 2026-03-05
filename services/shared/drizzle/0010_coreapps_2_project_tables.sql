-- CoreApps 2.0: New tables for Project module (termin, expenses, milestones, etc.)

-- project_termins
CREATE TABLE IF NOT EXISTS project_termins (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  termin_number INTEGER NOT NULL,
  description TEXT,
  percentage DECIMAL NOT NULL,
  amount DECIMAL NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'SCHEDULED',
  invoice_id INTEGER REFERENCES invoices(id),
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_termins_project_id ON project_termins(project_id);

-- project_expenses
CREATE TABLE IF NOT EXISTS project_expenses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  date DATE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  vendor_po_id TEXT,
  invoice_vendor_number TEXT,
  status TEXT DEFAULT 'DRAFT',
  submitted_by INTEGER REFERENCES employees(id),
  approved_by INTEGER REFERENCES employees(id),
  approved_at TIMESTAMP,
  rejected_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);

-- expense_attachments
CREATE TABLE IF NOT EXISTS expense_attachments (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER NOT NULL REFERENCES project_expenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by INTEGER REFERENCES employees(id)
);

-- project_milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'PENDING',
  linked_termin_id INTEGER REFERENCES project_termins(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- project_status_history
CREATE TABLE IF NOT EXISTS project_status_history (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by INTEGER REFERENCES employees(id),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON project_status_history(project_id);

-- project_documents
CREATE TABLE IF NOT EXISTS project_documents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by INTEGER REFERENCES employees(id)
);

-- project_team_members
CREATE TABLE IF NOT EXISTS project_team_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  role TEXT NOT NULL,
  assigned_at DATE DEFAULT CURRENT_DATE,
  removed_at DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);

-- client_purchase_orders
CREATE TABLE IF NOT EXISTS client_purchase_orders (
  id SERIAL PRIMARY KEY,
  cpo_number TEXT NOT NULL,
  internal_reference TEXT,
  project_id INTEGER REFERENCES projects(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  linked_proposal_id INTEGER REFERENCES proposal_penawaran(id),
  linked_proposal_version TEXT,
  amount DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  ppn_included BOOLEAN DEFAULT true,
  issued_date DATE,
  received_date DATE,
  valid_until DATE,
  description TEXT,
  payment_terms TEXT,
  status TEXT DEFAULT 'RECEIVED',
  attachment_url TEXT,
  attachment_name TEXT,
  verified_by INTEGER REFERENCES employees(id),
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES employees(id)
);
CREATE INDEX IF NOT EXISTS idx_cpo_project_id ON client_purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_cpo_client_id ON client_purchase_orders(client_id);

-- project_document_relations
CREATE TABLE IF NOT EXISTS project_document_relations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_id TEXT NOT NULL,
  linked_at TIMESTAMP DEFAULT NOW(),
  linked_by INTEGER REFERENCES employees(id)
);
CREATE INDEX IF NOT EXISTS idx_pdr_project_id ON project_document_relations(project_id);

-- erp_notifications (CoreApps 2.0 - separate from existing notifications which uses user_id)
CREATE TABLE IF NOT EXISTS erp_notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'MEDIUM',
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  project_id INTEGER REFERENCES projects(id),
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_notifications_recipient_id ON erp_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_erp_notifications_is_read ON erp_notifications(is_read);

-- sales_targets
CREATE TABLE IF NOT EXISTS sales_targets (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  target_amount DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  set_by INTEGER REFERENCES employees(id),
  set_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(year, quarter)
);
