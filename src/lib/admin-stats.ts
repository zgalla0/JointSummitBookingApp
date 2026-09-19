import type { Booking, BookingGuest } from "@prisma/client";
import { isWithinDiscountWindow, ptoBeforeAfterPivot } from "./config";
import { isoDateRange, addIsoDays } from "./stay-tiles-client";
import { toISODate } from "./format";
import { DIETARY_OPTION_KEYS, type DietaryOptionKey } from "./dietary-options";
import { ROOM_TYPE_KEYS, type RoomTypeKey } from "./room-types";
import { LOCATION_KEYS, type LocationKey } from "./location-options";

type BookingWithGuests = Booking & { guests: BookingGuest[] };

export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** ISO-date nights covered by a booking's stay, e.g. stayStart=Jan 21,
 *  stayEnd (checkout)=Jan 24 -> ["2026-01-21", "2026-01-22", "2026-01-23"]. */
export function bookingNights(b: Pick<Booking, "stayStart" | "stayEnd">): string[] {
  const stayStartIso = toISODate(b.stayStart);
  const stayEndIso = toISODate(b.stayEnd);
  const lastNightIso = addIsoDays(stayEndIso, -1);
  if (lastNightIso < stayStartIso) return [];
  return isoDateRange(stayStartIso, lastNightIso);
}

export type AdminStats = ReturnType<typeof computeAdminStats>;

/** Aggregates the dashboard's summary numbers from every booking (active +
 *  cancelled), so the page component just formats already-computed values. */
export function computeAdminStats(allBookings: BookingWithGuests[]) {
  const active = allBookings.filter((b) => b.status === "ACTIVE");
  const cancelled = allBookings.filter((b) => b.status === "CANCELLED");

  let additionalGuestsAdult = 0;
  let additionalGuestsChild = 0;
  let happyHour = 0;
  let happyHourPlusOne = 0;
  let allHands = 0;
  let dinner = 0;
  let dinnerPlusOne = 0;
  let companyPaidNights = 0;
  let selfPaidNights = 0;
  let discountWindowNights = 0;
  let outsideDiscountWindowNights = 0;
  let flaggedForReview = 0;
  const roomTypeCounts: Record<RoomTypeKey, number> = { DELUXE: 0, BRISAS: 0 };

  const notAttending = active.filter((b) => !b.isAttending).length;

  for (const b of active) {
    if (b.flaggedForReview) flaggedForReview++;

    // Declined bookings carry a zero-night placeholder and no real
    // attendance/logistics data - nothing else to count for them.
    if (!b.isAttending) continue;

    additionalGuestsAdult += b.guests.filter((g) => g.type === "ADULT").length;
    additionalGuestsChild += b.guests.filter((g) => g.type === "CHILD").length;

    if (b.attendingHappyHour) happyHour++;
    if (b.attendingAllHands) allHands++;
    if (b.attendingDinner) dinner++;
    for (const g of b.guests) {
      if (g.attendingHappyHour) happyHourPlusOne++;
      if (g.attendingDinner) dinnerPlusOne++;
    }

    const companyPaid = new Set(parseJsonArray(b.companyPaidNights));
    for (const night of bookingNights(b)) {
      if (companyPaid.has(night)) companyPaidNights++;
      else selfPaidNights++;
      if (isWithinDiscountWindow(new Date(`${night}T00:00:00.000Z`))) discountWindowNights++;
      else outsideDiscountWindowNights++;
    }

    if (b.extraNightsRoomType && (ROOM_TYPE_KEYS as readonly string[]).includes(b.extraNightsRoomType)) {
      roomTypeCounts[b.extraNightsRoomType as RoomTypeKey]++;
    }

  }

  return {
    totalActive: active.length,
    totalCancelled: cancelled.length,
    notAttending,
    additionalGuestsAdult,
    additionalGuestsChild,
    happyHour,
    happyHourPlusOne,
    allHands,
    dinner,
    dinnerPlusOne,
    companyPaidNights,
    selfPaidNights,
    discountWindowNights,
    outsideDiscountWindowNights,
    roomTypeCounts,
    flaggedForReview,
  };
}

export type EventKey = "happyHour" | "allHands" | "dinner";

export type DietaryByEventStats = Record<EventKey, Record<DietaryOptionKey, number>>;

function emptyDietaryCounts(): Record<DietaryOptionKey, number> {
  return Object.fromEntries(DIETARY_OPTION_KEYS.map((key) => [key, 0])) as Record<DietaryOptionKey, number>;
}

function addDietaryCounts(bucket: Record<DietaryOptionKey, number>, raw: string | null) {
  for (const key of parseJsonArray(raw)) {
    if ((DIETARY_OPTION_KEYS as readonly string[]).includes(key)) {
      bucket[key as DietaryOptionKey]++;
    }
  }
}

/** Dietary counts split per event, since attendance varies by event (not
 *  everyone attending the Summit joins Happy Hour or Dinner, and guests -
 *  who eat too - only ever join those two, never All Hands). Includes
 *  guest dietary needs alongside the attendee's own, for whichever events
 *  each person is actually down for. */
export function computeDietaryByEvent(allBookings: BookingWithGuests[]): DietaryByEventStats {
  const result: DietaryByEventStats = {
    happyHour: emptyDietaryCounts(),
    allHands: emptyDietaryCounts(),
    dinner: emptyDietaryCounts(),
  };

  const active = allBookings.filter((b) => b.status === "ACTIVE" && b.isAttending);
  for (const b of active) {
    if (b.attendingHappyHour) addDietaryCounts(result.happyHour, b.dietaryOptions);
    if (b.attendingAllHands) addDietaryCounts(result.allHands, b.dietaryOptions);
    if (b.attendingDinner) addDietaryCounts(result.dinner, b.dietaryOptions);
    for (const g of b.guests) {
      if (g.attendingHappyHour) addDietaryCounts(result.happyHour, g.dietaryOptions);
      if (g.attendingDinner) addDietaryCounts(result.dinner, g.dietaryOptions);
    }
  }

  return result;
}

function roundPercent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

export type FlightDetailsCoverage = {
  total: number;
  have: number;
  missing: number;
  missingPercent: number; // % of `total` that's missing, rounded
  byLocation: Record<LocationKey, { missing: number; missingShare: number }>; // missingShare = % of `missing` from this location
};

/** Whether an attending, active booking has anything flight-related on
 *  file at all - a person who filled in an airline or flight number for
 *  either leg but not the other still counts as "have" here, since
 *  they've at least started; the admin's own judgement (via the Flights
 *  page) is what decides if a follow-up is actually needed. */
export function computeFlightDetailsCoverage(allBookings: BookingWithGuests[]): FlightDetailsCoverage {
  const active = allBookings.filter((b) => b.status === "ACTIVE" && b.isAttending);

  let have = 0;
  let missing = 0;
  const missingByLocation = Object.fromEntries(LOCATION_KEYS.map((key) => [key, 0])) as Record<
    LocationKey,
    number
  >;

  for (const b of active) {
    const hasDetails = Boolean(
      b.flightArrivalAirline || b.flightArrivalNumber || b.flightDepartureAirline || b.flightDepartureNumber,
    );
    if (hasDetails) {
      have++;
    } else {
      missing++;
      if ((LOCATION_KEYS as readonly string[]).includes(b.location)) {
        missingByLocation[b.location as LocationKey]++;
      }
    }
  }

  return {
    total: active.length,
    have,
    missing,
    missingPercent: roundPercent(missing, active.length),
    byLocation: Object.fromEntries(
      LOCATION_KEYS.map((key) => [
        key,
        { missing: missingByLocation[key], missingShare: roundPercent(missingByLocation[key], missing) },
      ]),
    ) as Record<LocationKey, { missing: number; missingShare: number }>,
  };
}

function emptyPtoBucket(): PtoBucketStats {
  return {
    total: 0,
    byLocation: Object.fromEntries(LOCATION_KEYS.map((key) => [key, 0])) as Record<LocationKey, number>,
  };
}

export type PtoBucketStats = {
  total: number;
  byLocation: Record<LocationKey, number>;
};

export type PtoCoverageStats = {
  total: PtoBucketStats;
  before: PtoBucketStats;
  after: PtoBucketStats;
  pivotIso: string;
};

/** PTO days claimed (attendee only, one count per PTO date on their
 *  booking), split into "before the summit" / "after" around the pivot
 *  date, each broken down by location. */
export function computePtoCoverage(allBookings: BookingWithGuests[]): PtoCoverageStats {
  const pivotIso = toISODate(ptoBeforeAfterPivot());
  const total = emptyPtoBucket();
  const before = emptyPtoBucket();
  const after = emptyPtoBucket();

  const active = allBookings.filter((b) => b.status === "ACTIVE");
  for (const b of active) {
    const loc = (LOCATION_KEYS as readonly string[]).includes(b.location)
      ? (b.location as LocationKey)
      : null;
    for (const ptoDate of parseJsonArray(b.ptoDates)) {
      const bucket = ptoDate < pivotIso ? before : after;
      total.total++;
      bucket.total++;
      if (loc) {
        total.byLocation[loc]++;
        bucket.byLocation[loc]++;
      }
    }
  }

  return { total, before, after, pivotIso };
}

export type CalendarDayStats = {
  date: string;
  rooms: number;
  people: number;
  ptoTotal: number;
  ptoByLocation: Record<LocationKey, number>;
};

/** Per-day room count (one per active booking staying that night, i.e.
 *  distinct from headcount) plus headcount (attendee + their guests) and
 *  PTO counts (attendee only, broken down by location) across every date
 *  in [startIso, endIso], for the admin calendar view. */
export function computeCalendarStats(
  allBookings: BookingWithGuests[],
  startIso: string,
  endIso: string,
): Record<string, CalendarDayStats> {
  const days: Record<string, CalendarDayStats> = {};
  for (const date of isoDateRange(startIso, endIso)) {
    days[date] = {
      date,
      rooms: 0,
      people: 0,
      ptoTotal: 0,
      ptoByLocation: Object.fromEntries(LOCATION_KEYS.map((key) => [key, 0])) as Record<
        LocationKey,
        number
      >,
    };
  }

  const active = allBookings.filter((b) => b.status === "ACTIVE");
  for (const b of active) {
    const headcount = 1 + b.guests.length;
    for (const night of bookingNights(b)) {
      if (!days[night]) continue;
      days[night].rooms += 1;
      days[night].people += headcount;
    }
    for (const ptoDate of parseJsonArray(b.ptoDates)) {
      if (!days[ptoDate]) continue;
      days[ptoDate].ptoTotal += 1;
      if ((LOCATION_KEYS as readonly string[]).includes(b.location)) {
        days[ptoDate].ptoByLocation[b.location as LocationKey] += 1;
      }
    }
  }

  return days;
}
