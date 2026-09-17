-- CreateTable
CREATE TABLE "HotelExportLog" (
    "id" TEXT NOT NULL,
    "pulledBy" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HotelExportLog_pkey" PRIMARY KEY ("id")
);
