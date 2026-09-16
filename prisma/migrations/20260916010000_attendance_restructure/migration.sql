-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "isAttending" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Booking" DROP COLUMN "happyHourPlusOne";
ALTER TABLE "Booking" DROP COLUMN "dinnerPlusOne";

-- AlterTable
ALTER TABLE "BookingGuest" ADD COLUMN     "attendingHappyHour" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BookingGuest" ADD COLUMN     "attendingDinner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BookingGuest" ADD COLUMN     "dietaryOptions" TEXT;
ALTER TABLE "BookingGuest" ADD COLUMN     "dietaryOther" TEXT;
