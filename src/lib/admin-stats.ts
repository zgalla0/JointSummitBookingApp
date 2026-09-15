import type { Booking, BookingGuest } from "@prisma/client";
import { isWithinDiscountWindow } from "./config";
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
  let missingFlightDetails = 0;
  let ptoDatesCount = 0;
  const roomTypeCounts: Record<RoomTypeKey, number> = { DELUXE: 0, BRISAS: 0 };
  const dietaryCounts = Object.fromEntries(
    DIETARY_OPTION_KEYS.map((key) => [key, 0]),
  ) as Record<DietaryOptionKey, number>;

  for (const b of active) {
    additionalGuestsAdult += b.guests.filter((g) => g.type === "ADULT").length;
    additionalGuestsChild += b.guests.filter((g) => g.type === "CHILD").length;

    if (b.attendingHappyHour) {
      happyHour++;
      if (b.happyHourPlusOne) happyHourPlusOne++;
    }
    if (b.attendingAllHands) allHands++;
    if (b.attendingDinner) {
      dinner++;
      if (b.dinnerPlusOne) dinnerPlusOne++;
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

    if (b.flaggedForReview) flaggedForReview++;
    if (
      !b.flightArrivalAirline &&
      !b.flightArrivalNumber &&
      !b.flightDepartureAirline &&
      !b.flightDepartureNumber
    ) {
      missingFlightDetails++;
    }

    ptoDatesCount += parseJsonArray(b.ptoDates).length;

    for (const key of parseJsonArray(b.dietaryOptions)) {
      if ((DIETARY_OPTION_KEYS as readonly string[]).includes(key)) {
        dietaryCounts[key as DietaryOptionKey]++;
      }
    }
  }

  return {
    totalActive: active.length,
    totalCancelled: cancelled.length,
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
    dietaryCounts,
    flaggedForReview,
    missingFlightDetails,
    ptoDatesCount,
  };
}

export type CalendarDayStats = {
  date: string;
  people: number;
  ptoTotal: number;
  ptoByLocation: Record<LocationKey, number>;
};

/** Per-day headcount (attendee + their guests, for every night of their
 *  stay) and PTO counts (attendee only, broken down by location) across
 *  every date in [startIso, endIso], for the admin calendar view. */
export function computeCalendarStats(
  allBookings: BookingWithGuests[],
  startIso: string,
  endIso: string,
): Record<string, CalendarDayStats> {
  const days: Record<string, CalendarDayStats> = {};
  for (const date of isoDateRange(startIso, endIso)) {
    days[date] = {
      date,
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
      if (days[night]) days[night].people += headcount;
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
