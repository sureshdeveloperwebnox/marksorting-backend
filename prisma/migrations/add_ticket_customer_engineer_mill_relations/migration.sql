ALTER TABLE "support_tickets"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "service_engineer_id" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_id" TEXT,
  ADD COLUMN IF NOT EXISTS "mill_id" TEXT;

CREATE INDEX IF NOT EXISTS "support_tickets_service_engineer_id_idx" ON "support_tickets"("service_engineer_id");
CREATE INDEX IF NOT EXISTS "support_tickets_customer_id_idx" ON "support_tickets"("customer_id");
CREATE INDEX IF NOT EXISTS "support_tickets_mill_id_idx" ON "support_tickets"("mill_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_service_engineer_id_fkey'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_service_engineer_id_fkey"
      FOREIGN KEY ("service_engineer_id") REFERENCES "technicians"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_customer_id_fkey'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_customer_id_fkey"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_mill_id_fkey'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_mill_id_fkey"
      FOREIGN KEY ("mill_id") REFERENCES "mills"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
