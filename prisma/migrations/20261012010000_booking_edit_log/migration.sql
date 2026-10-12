-- AlterTable
ALTER TABLE "HotelExportSnapshot" ALTER COLUMN "hotelNote" DROP DEFAULT;

-- CreateTable
CREATE TABLE "BookingEditLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingEditLog_bookingId_idx" ON "BookingEditLog"("bookingId");
