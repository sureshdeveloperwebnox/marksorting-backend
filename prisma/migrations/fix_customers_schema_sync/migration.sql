-- Align customers table with Prisma schema
DROP INDEX IF EXISTS "customers_status_idx";

ALTER TABLE "customers" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "customers" ALTER COLUMN "updated_at" DROP DEFAULT;
