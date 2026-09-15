/*
  Warnings:

  - Added the required column `location` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LocationRegion" AS ENUM ('US_CAN_IRE', 'LATAM');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "location" "LocationRegion" NOT NULL;
