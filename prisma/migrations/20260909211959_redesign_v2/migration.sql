/*
  Warnings:

  - You are about to drop the column `dietaryRestrictions` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `selectEligible` on the `Booking` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "reservationName" TEXT NOT NULL,
    "hotelEmail" TEXT NOT NULL,
    "detailsEmail" TEXT NOT NULL,
    "attendingHappyHour" BOOLEAN NOT NULL DEFAULT false,
    "happyHourPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "attendingAllHands" BOOLEAN NOT NULL DEFAULT false,
    "allHandsPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "attendingDinner" BOOLEAN NOT NULL DEFAULT false,
    "stayStart" DATETIME NOT NULL,
    "stayEnd" DATETIME NOT NULL,
    "companyPaidNights" TEXT,
    "needsExtraNights" BOOLEAN NOT NULL DEFAULT false,
    "extraNights" TEXT,
    "dietaryOptions" TEXT,
    "dietaryOther" TEXT,
    "flightAirline" TEXT,
    "flightNumber" TEXT,
    "flightArrival" DATETIME,
    "flightDeparture" DATETIME,
    "flightNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" DATETIME,
    "cancelledByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "magicLinkToken" TEXT NOT NULL,
    "magicLinkExpiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Booking" ("attendingAllHands", "attendingDinner", "attendingHappyHour", "cancelledAt", "cancelledByAdmin", "createdAt", "detailsEmail", "extraNights", "firstName", "flagReason", "flaggedForReview", "flightAirline", "flightArrival", "flightDeparture", "flightNotes", "flightNumber", "hotelEmail", "id", "lastName", "magicLinkExpiresAt", "magicLinkToken", "needsExtraNights", "reservationName", "status", "stayEnd", "stayStart", "updatedAt") SELECT "attendingAllHands", "attendingDinner", "attendingHappyHour", "cancelledAt", "cancelledByAdmin", "createdAt", "detailsEmail", "extraNights", "firstName", "flagReason", "flaggedForReview", "flightAirline", "flightArrival", "flightDeparture", "flightNotes", "flightNumber", "hotelEmail", "id", "lastName", "magicLinkExpiresAt", "magicLinkToken", "needsExtraNights", "reservationName", "status", "stayEnd", "stayStart", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_magicLinkToken_key" ON "Booking"("magicLinkToken");
CREATE INDEX "Booking_lastName_firstName_hotelEmail_idx" ON "Booking"("lastName", "firstName", "hotelEmail");
CREATE INDEX "Booking_magicLinkToken_idx" ON "Booking"("magicLinkToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
