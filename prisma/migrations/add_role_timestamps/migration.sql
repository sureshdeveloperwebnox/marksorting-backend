-- Add missing timestamp columns to roles table
ALTER TABLE roles 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Update existing rows to have timestamps
UPDATE roles SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL;
