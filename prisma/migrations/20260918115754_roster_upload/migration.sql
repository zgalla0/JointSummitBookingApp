-- CreateTable
CREATE TABLE "RosterUpload" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "fileName" TEXT NOT NULL,
    "rows" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RosterUpload_pkey" PRIMARY KEY ("id")
);
