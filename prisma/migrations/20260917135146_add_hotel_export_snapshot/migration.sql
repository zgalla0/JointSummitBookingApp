-- CreateTable
CREATE TABLE "HotelExportSnapshot" (
    "bookingId" TEXT NOT NULL,
    "reservationFirstName" TEXT NOT NULL,
    "reservationLastName" TEXT NOT NULL,
    "nameTag" TEXT,
    "stayStart" TIMESTAMP(3) NOT NULL,
    "stayEnd" TIMESTAMP(3) NOT NULL,
    "companyPaidNights" TEXT,
    "extraNightsRoomType" TEXT,
    "guestCount" INTEGER NOT NULL,
    "guestNames" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelExportSnapshot_pkey" PRIMARY KEY ("bookingId")
);
