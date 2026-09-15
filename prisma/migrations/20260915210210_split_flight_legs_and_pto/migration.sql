/*
  Warnings:

  - You are about to drop the column `flightAirline` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `flightNumber` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "flightAirline",
DROP COLUMN "flightNumber",
ADD COLUMN     "flightArrivalAirline" TEXT,
ADD COLUMN     "flightArrivalNumber" TEXT,
ADD COLUMN     "flightDepartureAirline" TEXT,
ADD COLUMN     "flightDepartureNumber" TEXT;
