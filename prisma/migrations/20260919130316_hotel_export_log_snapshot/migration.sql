-- AlterTable
ALTER TABLE "HotelExportLog" ADD COLUMN     "draftEmail" TEXT,
ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "filename" TEXT;
