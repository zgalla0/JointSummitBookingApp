-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "hotelNote" TEXT;

-- AlterTable
ALTER TABLE "HotelExportSnapshot" ADD COLUMN     "hotelNote" TEXT NOT NULL DEFAULT '';
