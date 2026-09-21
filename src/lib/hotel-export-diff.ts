import type { Booking, BookingGuest, HotelExportSnapshot } from "@prisma/client";
import { toISODate } from "./format";
import { bookingNights, parseJsonArray } from "./admin-stats";
import { ROOM_TYPES } from "./room-types";

export type BookingWithGuests = Booking & { guests: BookingGuest[] };

export type ClassifiedRow = { booking: BookingWithGuests; whatChanged?: string; changedFields?: string[] };

/** A single detected change: `fields` are the Hotel Export row's column
 *  keys it affects, used to highlight only those cells instead of the
 *  whole row. */
type FieldChange = { fields: string[]; description: string };

export type HotelExportClassification = {
  newRows: ClassifiedRow[];
  editedRows: ClassifiedRow[];
  unchangedRows: ClassifiedRow[];
  cancelledRows: ClassifiedRow[];
};

/** Parses the optional manual "since" override from a request body - a
 *  plain date string, or absent/invalid, in which case the caller falls
 *  back to the tracked last-pull timestamp. Shared by the preview and send
 *  routes so a "Send to Hotel" reuses exactly the comparison point its
 *  preceding "Pull" showed. */
export function parseOverrideSince(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Every column the hotel actually sees, computed fresh from a booking's
 *  current state. This is also exactly what gets snapshotted after every
 *  send and diffed against on the next one - keeping it to one shape
 *  means a change to any of these columns is guaranteed to be caught by
 *  diffHotelSnapshot below, with no separate list of "things that count as
 *  a change" to keep in sync by hand. Room type is blank when the stay
 *  never left the standard block (the hotel assigns the room itself then
 *  - nothing was chosen), and shows the picked type's label otherwise. */
export type HotelExportFields = {
  reservationFirstName: string;
  reservationLastName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  nightsCompanyPaid: number;
  nightsSelfPaid: number;
  roomType: string;
  totalOccupants: number;
  additionalGuestNames: string;
  contactEmail: string;
};

export function computeHotelExportFields(b: BookingWithGuests): HotelExportFields {
  const nights = bookingNights(b);
  const companyPaid = new Set(parseJsonArray(b.companyPaidNights));
  const roomType = b.extraNightsRoomType
    ? (ROOM_TYPES.find((rt) => rt.key === b.extraNightsRoomType)?.label ?? b.extraNightsRoomType)
    : "";

  return {
    reservationFirstName: b.reservationFirstName,
    reservationLastName: b.reservationLastName,
    checkIn: toISODate(b.stayStart),
    checkOut: toISODate(b.stayEnd),
    nights: nights.length,
    nightsCompanyPaid: nights.filter((n) => companyPaid.has(n)).length,
    nightsSelfPaid: nights.filter((n) => !companyPaid.has(n)).length,
    roomType,
    totalOccupants: 1 + b.guests.length,
    additionalGuestNames: b.guests.map((g) => `${g.firstName} ${g.lastName}`).join(", "),
    contactEmail: b.hotelEmail,
  };
}

const FIELD_LABELS: Record<keyof HotelExportFields, string> = {
  reservationFirstName: "First name",
  reservationLastName: "Last name",
  checkIn: "Check-in",
  checkOut: "Check-out",
  nights: "Nights",
  nightsCompanyPaid: "Company-paid nights",
  nightsSelfPaid: "Self-paid nights",
  roomType: "Room type",
  totalOccupants: "Occupants",
  additionalGuestNames: "Other occupants",
  contactEmail: "Contact email",
};

function displayValue(value: string | number): string {
  return value === "" ? "(none)" : String(value);
}

/** Diffs every hotel-facing column independently, so a change to one cell
 *  (e.g. just the check-out date) is never bundled in with cells that
 *  didn't actually change (e.g. check-in, or nights when the stay shifted
 *  by the same number of days on both ends). Returns [] when nothing
 *  hotel-relevant actually changed (e.g. the booking's `updatedAt` moved
 *  because of a dietary edit). `prev` is null when no snapshot was ever
 *  taken for this booking (it predates this feature, or the snapshot table
 *  was just reshaped) - in that case every column counts as "changed" so
 *  each cell (never the whole row) still gets highlighted, rather than
 *  silently treating an unknown prior state as "nothing changed". */
function diffHotelSnapshot(prev: HotelExportFields | null, curr: HotelExportFields): FieldChange[] {
  if (!prev) {
    return (Object.keys(curr) as (keyof HotelExportFields)[]).map((key) => ({
      fields: [key],
      description: `${FIELD_LABELS[key]} recorded (no prior snapshot on record to compare against)`,
    }));
  }

  const changes: FieldChange[] = [];
  for (const key of Object.keys(curr) as (keyof HotelExportFields)[]) {
    if (prev[key] !== curr[key]) {
      changes.push({
        fields: [key],
        description: `${FIELD_LABELS[key]} updated (was ${displayValue(prev[key])}, now ${displayValue(curr[key])})`,
      });
    }
  }
  return changes;
}

/** Classifies every booking that could ever appear on a Hotel Export pull,
 *  since the hotel now needs the full current roster every time, not just
 *  what changed. Priority is New, then Cancelled, then Edited, then
 *  Unchanged - each booking lands in exactly one bucket. `since` is null
 *  only on the very first-ever pull, in which case every currently active,
 *  attending booking counts as "new" (there's no prior pull the hotel could
 *  already know about). Bookings that aren't attending never need a hotel
 *  room, so they're skipped entirely. A cancelled booking stays in
 *  `cancelledRows` on every pull - regardless of `since` - until an admin
 *  marks it cleared once the hotel has actually processed it. */
export function classifyForHotelExport(
  bookings: BookingWithGuests[],
  since: Date | null,
  snapshots: Map<string, HotelExportSnapshot>,
): HotelExportClassification {
  const newRows: ClassifiedRow[] = [];
  const editedRows: ClassifiedRow[] = [];
  const unchangedRows: ClassifiedRow[] = [];
  const cancelledRows: ClassifiedRow[] = [];

  for (const b of bookings) {
    if (b.status === "CANCELLED") {
      if (!b.hotelExportClearedAt) cancelledRows.push({ booking: b });
      continue;
    }

    if (!b.isAttending) continue;

    if (!since || b.createdAt > since) {
      newRows.push({ booking: b });
      continue;
    }

    if (b.updatedAt <= since) {
      unchangedRows.push({ booking: b });
      continue;
    }

    const snapshot = snapshots.get(b.id) ?? null;
    const changes = diffHotelSnapshot(snapshot, computeHotelExportFields(b));
    if (changes.length > 0) {
      editedRows.push({
        booking: b,
        whatChanged: changes.map((c) => c.description).join("; "),
        changedFields: [...new Set(changes.flatMap((c) => c.fields))],
      });
    } else {
      unchangedRows.push({ booking: b });
    }
  }

  return { newRows, editedRows, unchangedRows, cancelledRows };
}
