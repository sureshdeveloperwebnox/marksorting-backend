-- Add machine_mfg_date field to installation_reports table (nullable, safe for existing rows)
ALTER TABLE "installation_reports" 
ADD COLUMN IF NOT EXISTS "machine_mfg_date" TIMESTAMP(3);
