-- Drop FK constraint and mill_id column from customers table
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_mill_id_fkey";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "mill_id";
DROP INDEX IF EXISTS "customers_mill_id_idx";
