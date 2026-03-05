-- Add phase column to project_expenses table
-- Phase: PRE_COST (before project start) | ON_GOING (during project)
ALTER TABLE project_expenses ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'ON_GOING';
