-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "reservationName" TEXT NOT NULL,
    "hotelEmail" TEXT NOT NULL,
    "detailsEmail" TEXT NOT NULL,
    "attendingHappyHour" BOOLEAN NOT NULL DEFAULT false,
    "attendingAllHands" BOOLEAN NOT NULL DEFAULT false,
    "attendingDinner" BOOLEAN NOT NULL DEFAULT false,
    "stayStart" DATETIME NOT NULL,
    "stayEnd" DATETIME NOT NULL,
    "selectEligible" BOOLEAN NOT NULL DEFAULT false,
    "needsExtraNights" BOOLEAN NOT NULL DEFAULT false,
    "extraNights" TEXT,
    "dietaryRestrictions" TEXT,
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

-- CreateTable
CREATE TABLE "BookingGuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "BookingGuest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaticContent" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "body" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_magicLinkToken_key" ON "Booking"("magicLinkToken");

-- CreateIndex
CREATE INDEX "Booking_lastName_firstName_hotelEmail_idx" ON "Booking"("lastName", "firstName", "hotelEmail");

-- CreateIndex
CREATE INDEX "Booking_magicLinkToken_idx" ON "Booking"("magicLinkToken");

-- CreateIndex
CREATE INDEX "BookingGuest_bookingId_idx" ON "BookingGuest"("bookingId");
