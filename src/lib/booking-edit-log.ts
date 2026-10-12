import type { Booking } from "@prisma/client";
import { parseJsonArray } from "./admin-stats";
import { LOCATION_OPTIONS } from "./location-options";
import { ROOM_TYPES } from "./room-types";

type FieldKey = keyof Booking;

const JSON_ARRAY_FIELDS: readonly FieldKey[] = ["companyPaidNights", "ptoDates", "dietaryOptions", "activityOptions"];

const DATE_FIELDS: readonly FieldKey[] = ["stayStart", "stayEnd", "flightArrival", "flightDeparture"];

const BOOLEAN_FIELDS: readonly FieldKey[] = [
  "isAttending",
  "attendingHappyHour",
  "attendingAllHands",
  "attendingDinner",
  "flaggedForReview",
];

// Every field an admin edit can touch, in the order they should appear in a
// log entry - also doubles as the label shown for each. Deliberately scoped
// to Booking's own columns; guest-row changes (a separate table) aren't
// itemized field-by-field here.
const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
  firstName: "First name",
  lastName: "Last name",
  isAttending: "Attending",
  location: "Location",
  reservationFirstName: "Reservation first name",
  reservationLastName: "Reservation last name",
  nameTag: "Name tag",
  hotelEmail: "Hotel email",
  detailsEmail: "Details email",
  cuestaEmail: "Cuesta email",
  attendingHappyHour: "Happy Hour",
  attendingAllHands: "All Hands",
  attendingDinner: "Dinner",
  stayStart: "Check-in",
  stayEnd: "Check-out",
  companyPaidNights: "Company-paid nights",
  extraNightsRoomType: "Extra-nights room type",
  ptoDates: "PTO dates",
  dietaryOptions: "Dietary options",
  dietaryOther: "Dietary (other)",
  activityOptions: "Activity options",
  activityOther: "Activity (other)",
  flightArrivalAirline: "Arrival airline",
  flightArrivalNumber: "Arrival flight #",
  flightArrival: "Arrival time",
  flightDepartureAirline: "Departure airline",
  flightDepartureNumber: "Departure flight #",
  flightDeparture: "Departure time",
  additionalNotes: "Note for planning team",
  hotelNote: "Note for hotel",
  flaggedForReview: "Flagged for review",
  flagReason: "Flag reason",
};

const EDITABLE_FIELDS = Object.keys(FIELD_LABELS) as FieldKey[];

function displayValue(field: FieldKey, value: unknown): string {
  if (value === null || value === undefined || value === "") return "(none)";
  if (BOOLEAN_FIELDS.includes(field)) return value ? "Yes" : "No";
  if (DATE_FIELDS.includes(field)) return value instanceof Date ? value.toISOString() : String(value);
  if (JSON_ARRAY_FIELDS.includes(field)) {
    const arr = parseJsonArray(value as string | null);
    return arr.length ? arr.join(", ") : "(none)";
  }
  if (field === "location") return LOCATION_OPTIONS.find((o) => o.key === value)?.label ?? String(value);
  if (field === "extraNightsRoomType") return ROOM_TYPES.find((rt) => rt.key === value)?.label ?? String(value);
  return String(value);
}

function rawEquals(field: FieldKey, a: unknown, b: unknown): boolean {
  if (DATE_FIELDS.includes(field)) {
    const at = a instanceof Date ? a.getTime() : a;
    const bt = b instanceof Date ? b.getTime() : b;
    return at === bt;
  }
  return a === b;
}

/** Plain-English, one-line-per-field summary of what changed between two
 *  versions of the same booking - used for the admin edit log, so an entry
 *  reads like a real changelog instead of a raw before/after JSON blob. */
export function describeBookingChanges(before: Booking, after: Booking): string[] {
  const changes: string[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (!rawEquals(field, before[field], after[field])) {
      changes.push(`${FIELD_LABELS[field]}: ${displayValue(field, before[field])} → ${displayValue(field, after[field])}`);
    }
  }
  return changes;
}
