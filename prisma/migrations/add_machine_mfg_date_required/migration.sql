-- Add machine_mfg_date field to installation_reports table
ALTER TABLE "installation_reports" 
ADD COLUMN "machine_mfg_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make machine_mfg_date field required in service_reports table
ALTER TABLE "service_reports" 
ALTER COLUMN "machine_mfg_date" SET NOT NULL,
ALTER COLUMN "machine_mfg_date" SET DEFAULT CURRENT_TIMESTAMP;
