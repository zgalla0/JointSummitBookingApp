-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "reservationFirstName" TEXT NOT NULL,
    "reservationLastName" TEXT NOT NULL,
    "hotelEmail" TEXT NOT NULL,
    "detailsEmail" TEXT NOT NULL,
    "attendingHappyHour" BOOLEAN NOT NULL DEFAULT false,
    "happyHourPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "attendingAllHands" BOOLEAN NOT NULL DEFAULT false,
    "attendingDinner" BOOLEAN NOT NULL DEFAULT false,
    "dinnerPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "stayStart" TIMESTAMP(3) NOT NULL,
    "stayEnd" TIMESTAMP(3) NOT NULL,
    "companyPaidNights" TEXT,
    "extraNightsRoomType" TEXT,
    "ptoDates" TEXT,
    "dietaryOptions" TEXT,
    "dietaryOther" TEXT,
    "flightAirline" TEXT,
    "flightNumber" TEXT,
    "flightArrival" TIMESTAMP(3),
    "flightDeparture" TIMESTAMP(3),
    "flightNotes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" TIMESTAMP(3),
    "cancelledByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "magicLinkToken" TEXT NOT NULL,
    "magicLinkExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingGuest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" "GuestType" NOT NULL,

    CONSTRAINT "BookingGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaticContent" (
    "key" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaticContent_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_magicLinkToken_key" ON "Booking"("magicLinkToken");

-- CreateIndex
CREATE INDEX "Booking_lastName_firstName_hotelEmail_idx" ON "Booking"("lastName", "firstName", "hotelEmail");

-- CreateIndex
CREATE INDEX "Booking_magicLinkToken_idx" ON "Booking"("magicLinkToken");

-- CreateIndex
CREATE INDEX "BookingGuest_bookingId_idx" ON "BookingGuest"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingGuest" ADD CONSTRAINT "BookingGuest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
