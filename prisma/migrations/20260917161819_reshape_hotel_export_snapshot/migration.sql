-- HotelExportSnapshot is a diffing cache, not real user data: it gets
-- fully rewritten on every "Send to Hotel". Reshaping it around new
-- columns means any existing rows no longer mean anything (they held a
-- different set of fields), so we clear it out rather than try to backfill
-- values like `nights` or `roomType` for old rows. The one visible effect
-- is that any booking edited between the last real send and this deploy
-- shows up as "Updated (no prior snapshot on record to compare against)"
-- with the whole row highlighted on the very next pull, instead of a
-- precise per-field diff - the same fallback already used for a
-- booking that predates this feature entirely. Everything is back to
-- precise per-field tracking starting with the next send after that.
TRUNCATE TABLE "HotelExportSnapshot";

-- AlterTable
ALTER TABLE "HotelExportSnapshot" DROP COLUMN "stayStart",
DROP COLUMN "stayEnd",
DROP COLUMN "companyPaidNights",
DROP COLUMN "extraNightsRoomType",
DROP COLUMN "guestCount",
DROP COLUMN "guestNames",
ALTER COLUMN "nameTag" SET NOT NULL,
ADD COLUMN "checkIn" TEXT NOT NULL,
ADD COLUMN "checkOut" TEXT NOT NULL,
ADD COLUMN "nights" INTEGER NOT NULL,
ADD COLUMN "nightsCompanyPaid" INTEGER NOT NULL,
ADD COLUMN "nightsSelfPaid" INTEGER NOT NULL,
ADD COLUMN "roomType" TEXT NOT NULL,
ADD COLUMN "totalOccupants" INTEGER NOT NULL,
ADD COLUMN "additionalGuestNames" TEXT NOT NULL,
ADD COLUMN "contactEmail" TEXT NOT NULL;
