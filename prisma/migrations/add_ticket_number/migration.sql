ALTER TABLE "support_tickets"
  ADD COLUMN IF NOT EXISTS "ticket_number" TEXT;

UPDATE "support_tickets"
SET "ticket_number" = 'TKT-' || UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 10))
WHERE "ticket_number" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_ticket_number_key"
  ON "support_tickets"("ticket_number");

CREATE INDEX IF NOT EXISTS "support_tickets_ticket_number_idx"
  ON "support_tickets"("ticket_number");
