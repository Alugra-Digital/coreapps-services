-- Start transaction
BEGIN;

-- Expand the Journal Entries table to store source relationships
-- Enable linking a journal entry back to the original document (Voucher, Kas Kecil, Kas Bank, dll)
ALTER TABLE journal_entries 
ADD COLUMN source_type VARCHAR(50),
ADD COLUMN source_id INTEGER;

-- Add index on source_type and source_id for faster lookup during drill-down operations
CREATE INDEX idx_je_source ON journal_entries(source_type, source_id);

-- Commit transaction
COMMIT;
