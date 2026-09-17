-- AlterTable
-- nameTag is nullable (not everyone needs a different name-tag name), so
-- it needs no backfill value.
ALTER TABLE "Booking" ADD COLUMN     "nameTag" TEXT;

-- Backfill existing rows (test bookings from earlier rounds) with a
-- placeholder default, then drop the default so schema.prisma (which
-- declares no @default) and the DB stay in sync for future migrations.
ALTER TABLE "Booking" ADD COLUMN     "cuestaEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Booking" ALTER COLUMN "cuestaEmail" DROP DEFAULT;
