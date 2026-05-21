-- AlterTable: fix roles timestamp types
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable: add missing background_image column to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "background_image" TEXT;
