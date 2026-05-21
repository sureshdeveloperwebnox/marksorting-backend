-- CreateTable: customers (mill-based)
CREATE TABLE IF NOT EXISTS "customers" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "mill_id"    TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "email"      TEXT,
  "phone"      TEXT,
  "address"    TEXT,
  "status"     TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "customers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "customers_mill_id_fkey" FOREIGN KEY ("mill_id") REFERENCES "mills"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Index for fast mill-based lookups
CREATE INDEX IF NOT EXISTS "customers_mill_id_idx" ON "customers"("mill_id");
CREATE INDEX IF NOT EXISTS "customers_status_idx" ON "customers"("status");
