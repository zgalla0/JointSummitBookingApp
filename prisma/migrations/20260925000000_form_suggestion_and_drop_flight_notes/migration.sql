-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "flightNotes";

-- CreateTable
CREATE TABLE "FormSuggestion" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSuggestion_pkey" PRIMARY KEY ("id")
);
