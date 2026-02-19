-- New modules: BAST, Projects, Tax Types, Proposal Penawaran

CREATE TABLE IF NOT EXISTS basts (
  id SERIAL PRIMARY KEY,
  cover_info JSONB NOT NULL,
  document_info JSONB NOT NULL,
  delivering_party JSONB NOT NULL,
  receiving_party JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  identity JSONB NOT NULL,
  document_relations JSONB DEFAULT '{}',
  finance JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rate DECIMAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  regulation TEXT,
  applicable_documents JSONB DEFAULT '[]',
  document_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_penawaran (
  id SERIAL PRIMARY KEY,
  cover_info JSONB NOT NULL,
  proposal_number TEXT NOT NULL,
  client_info JSONB NOT NULL,
  client_background TEXT,
  offered_solution TEXT,
  working_method TEXT,
  timeline TEXT,
  portfolio TEXT,
  items JSONB NOT NULL,
  total_estimated_cost DECIMAL NOT NULL,
  total_estimated_cost_in_words TEXT NOT NULL,
  currency TEXT DEFAULT 'IDR',
  scope_of_work JSONB DEFAULT '[]',
  terms_and_conditions JSONB DEFAULT '[]',
  notes TEXT,
  document_approval JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
