ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_expense_category_id_fkey";

ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "admin_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "expense_type" TEXT NOT NULL DEFAULT 'MILL',
  ADD COLUMN IF NOT EXISTS "installation_report_id" TEXT,
  ADD COLUMN IF NOT EXISTS "remarks" TEXT,
  ADD COLUMN IF NOT EXISTS "report_type" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "service_report_id" TEXT,
  ALTER COLUMN "expense_category_id" DROP NOT NULL;

ALTER TABLE "installation_reports"
  ADD COLUMN IF NOT EXISTS "expense_id" TEXT,
  ADD COLUMN IF NOT EXISTS "running_channel_combination" INTEGER,
  ADD COLUMN IF NOT EXISTS "running_channel_combination_value" TEXT;

ALTER TABLE "service_reports"
  ADD COLUMN IF NOT EXISTS "expense_id" TEXT;

CREATE TABLE IF NOT EXISTS "expense_items" (
  "id" TEXT NOT NULL,
  "expense_id" TEXT NOT NULL,
  "expense_category_id" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "admin_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "remarks" TEXT,
  "expense_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "expense_items_expense_id_expense_category_id_key"
  ON "expense_items"("expense_id", "expense_category_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_expense_category_id_fkey'
  ) THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_expense_category_id_fkey"
      FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_service_report_id_fkey'
  ) THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_service_report_id_fkey"
      FOREIGN KEY ("service_report_id") REFERENCES "service_reports"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_installation_report_id_fkey'
  ) THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_installation_report_id_fkey"
      FOREIGN KEY ("installation_report_id") REFERENCES "installation_reports"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expense_items_expense_id_fkey'
  ) THEN
    ALTER TABLE "expense_items"
      ADD CONSTRAINT "expense_items_expense_id_fkey"
      FOREIGN KEY ("expense_id") REFERENCES "expenses"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expense_items_expense_category_id_fkey'
  ) THEN
    ALTER TABLE "expense_items"
      ADD CONSTRAINT "expense_items_expense_category_id_fkey"
      FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
