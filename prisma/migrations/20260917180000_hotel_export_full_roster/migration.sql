-- Add per-row "cleared" tracking for cancelled bookings on the Hotel Export
-- roster: once set, that booking stops appearing on future pulls.
ALTER TABLE "Booking" ADD COLUMN "hotelExportClearedAt" TIMESTAMP(3);

-- Drop the "Name tag" column from the Hotel Export snapshot - no longer a
-- column on the Hotel Export roster (see hotel-export-diff.ts).
ALTER TABLE "HotelExportSnapshot" DROP COLUMN "nameTag";
