-- CreateEnum
CREATE TYPE "LocationRegion" AS ENUM ('US_CAN_IRE', 'LATAM');

-- AlterTable
-- Backfill existing rows (test bookings from earlier rounds) with a
-- placeholder default, then drop the default so schema.prisma (which
-- declares no @default) and the DB stay in sync for future migrations.
ALTER TABLE "Booking" ADD COLUMN     "location" "LocationRegion" NOT NULL DEFAULT 'US_CAN_IRE';
ALTER TABLE "Booking" ALTER COLUMN "location" DROP DEFAULT;
