import type { Booking, BookingGuest, HotelExportSnapshot } from "@prisma/client";
import { toISODate } from "./format";
import { ROOM_TYPES } from "./room-types";

export type BookingWithGuests = Booking & { guests: BookingGuest[] };

export type ClassifiedRow = { booking: BookingWithGuests; whatChanged?: string; changedFields?: string[] };

/** A single detected change: `fields` are the Hotel Export row's column
 *  keys (from hotel-export-workbook.ts's row shape) that it affects, used
 *  to highlight only those cells instead of the whole row. */
export type FieldChange = { fields: string[]; description: string };

export type HotelExportClassification = {
  newRows: ClassifiedRow[];
  editedRows: ClassifiedRow[];
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

type SnapshotFields = Pick<
  HotelExportSnapshot,
  | "reservationFirstName"
  | "reservationLastName"
  | "nameTag"
  | "stayStart"
  | "stayEnd"
  | "companyPaidNights"
  | "extraNightsRoomType"
  | "guestCount"
  | "guestNames"
>;

/** The hotel-relevant subset of a booking's fields, snapshotted after every
 *  Hotel Export pull and diffed against on the next one. Fields not listed
 *  here (dietary, flight, PTO, internal notes, etc.) don't matter to the
 *  hotel, so changing them alone should never mark a booking as "Edited". */
export function currentHotelSnapshotFields(b: BookingWithGuests): SnapshotFields {
  return {
    reservationFirstName: b.reservationFirstName,
    reservationLastName: b.reservationLastName,
    nameTag: b.nameTag ?? null,
    stayStart: b.stayStart,
    stayEnd: b.stayEnd,
    companyPaidNights: b.companyPaidNights ?? null,
    extraNightsRoomType: b.extraNightsRoomType ?? null,
    guestCount: b.guests.length,
    guestNames: b.guests
      .map((g) => `${g.firstName} ${g.lastName}`)
      .sort()
      .join("; "),
  };
}

function roomTypeLabel(key: string): string {
  return ROOM_TYPES.find((rt) => rt.key === key)?.label ?? key;
}

/** Describes what changed between a prior snapshot and the booking's
 *  current hotel-relevant fields, both in plain language for the "What
 *  changed" export column and as the specific row columns it affects (so
 *  only those cells get highlighted, not the whole row). Returns [] when
 *  nothing hotel-relevant actually changed (e.g. the booking's `updatedAt`
 *  moved because of a dietary edit). `prev` is null when no snapshot was
 *  ever taken for this booking (it predates this feature, or this is the
 *  very first pull) - in that case we can't say what changed, only that
 *  something did, so `fields` comes back empty (the caller falls back to
 *  highlighting the whole row when nothing more specific is known). */
export function diffHotelSnapshot(prev: SnapshotFields | null, curr: SnapshotFields): FieldChange[] {
  if (!prev) return [{ fields: [], description: "Updated (no prior snapshot on record to compare against)" }];

  const changes: FieldChange[] = [];

  if (+prev.stayStart !== +curr.stayStart || +prev.stayEnd !== +curr.stayEnd) {
    changes.push({
      fields: ["checkIn", "checkOut", "nights"],
      description: `Stay dates updated (was ${toISODate(prev.stayStart)}–${toISODate(prev.stayEnd)}, now ${toISODate(curr.stayStart)}–${toISODate(curr.stayEnd)})`,
    });
  }

  if ((prev.companyPaidNights ?? "") !== (curr.companyPaidNights ?? "")) {
    changes.push({ fields: ["nightsCompanyPaid", "nightsSelfPaid"], description: "Company-paid/self-paid night split changed" });
  }

  if ((prev.extraNightsRoomType ?? "") !== (curr.extraNightsRoomType ?? "")) {
    changes.push({
      fields: ["roomType"],
      description: curr.extraNightsRoomType
        ? `Room type changed to ${roomTypeLabel(curr.extraNightsRoomType)}`
        : "Extra-night room type removed",
    });
  }

  if (prev.guestCount !== curr.guestCount) {
    const diff = curr.guestCount - prev.guestCount;
    changes.push({
      fields: ["totalOccupants", "additionalGuestNames"],
      description: diff > 0 ? `Added ${diff} guest${diff === 1 ? "" : "s"}` : `Removed ${-diff} guest${-diff === 1 ? "" : "s"}`,
    });
  } else if (prev.guestNames !== curr.guestNames) {
    changes.push({ fields: ["additionalGuestNames"], description: "Guest list updated" });
  }

  if (prev.reservationFirstName !== curr.reservationFirstName || prev.reservationLastName !== curr.reservationLastName) {
    changes.push({ fields: ["reservationFirstName", "reservationLastName"], description: "Reservation name updated" });
  }

  if ((prev.nameTag ?? "") !== (curr.nameTag ?? "")) {
    changes.push({ fields: ["nameTag"], description: "Name tag updated" });
  }

  return changes;
}

/** Splits bookings into what the hotel needs to hear about since `since`
 *  (null on the very first-ever pull, in which case every currently active,
 *  attending booking counts as "new" and nothing counts as edited/cancelled
 *  - there's no prior pull the hotel could already know about). Bookings
 *  that aren't attending never need a hotel room, so they're skipped
 *  entirely regardless of category. */
export function classifyForHotelExport(
  bookings: BookingWithGuests[],
  since: Date | null,
  snapshots: Map<string, HotelExportSnapshot>,
): HotelExportClassification {
  const newRows: ClassifiedRow[] = [];
  const editedRows: ClassifiedRow[] = [];
  const cancelledRows: ClassifiedRow[] = [];

  for (const b of bookings) {
    if (b.status === "CANCELLED") {
      if (since && b.cancelledAt && b.cancelledAt > since) {
        cancelledRows.push({ booking: b });
      }
      continue;
    }

    if (!b.isAttending) continue;

    if (!since || b.createdAt > since) {
      newRows.push({ booking: b });
      continue;
    }

    if (b.updatedAt > since) {
      const snapshot = snapshots.get(b.id) ?? null;
      const changes = diffHotelSnapshot(snapshot, currentHotelSnapshotFields(b));
      if (changes.length > 0) {
        editedRows.push({
          booking: b,
          whatChanged: changes.map((c) => c.description).join("; "),
          changedFields: [...new Set(changes.flatMap((c) => c.fields))],
        });
      }
    }
  }

  return { newRows, editedRows, cancelledRows };
}

/** Plain-text summary meant to be pasted into an email to the hotel
 *  alongside the attached workbook - see the "Since ..." example in the
 *  Hotel Export admin page. */
export function buildHotelExportSummary(
  since: Date | null,
  counts: { newCount: number; editedCount: number; cancelledCount: number },
): string {
  const opener = since ? `Since ${toISODate(since)}` : "First pull";
  const parts = [
    `${counts.newCount} new booking${counts.newCount === 1 ? "" : "s"}`,
    `${counts.editedCount} edited booking${counts.editedCount === 1 ? "" : "s"}`,
    `${counts.cancelledCount} cancellation${counts.cancelledCount === 1 ? "" : "s"}`,
  ];
  return `${opener}: ${parts.join(", ")}. See attached for details.`;
}
