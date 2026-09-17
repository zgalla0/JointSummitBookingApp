import ExcelJS from "exceljs";
import type { Booking, BookingGuest } from "@prisma/client";
import { toISODate } from "./format";
import { parseJsonArray, bookingNights } from "./admin-stats";
import { ROOM_TYPES } from "./room-types";

type BookingWithGuests = Booking & { guests: BookingGuest[] };
type ChangeState = "new" | "changed" | null;

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
const NEW_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } };
const CHANGED_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };

/** New = created after the last pull. Changed = existed before the last
 *  pull but has been updated since (edited, cancelled, flagged, etc). Null
 *  (no highlight) on the very first-ever pull, since there's no baseline
 *  to compare against yet. */
function changeStateOf(b: BookingWithGuests, since: Date | null): ChangeState {
  if (!since) return null;
  if (b.createdAt > since) return "new";
  if (b.updatedAt > since) return "changed";
  return null;
}

function fullRow(b: BookingWithGuests) {
  const companyPaid = new Set(parseJsonArray(b.companyPaidNights));
  const nights = bookingNights(b);
  return {
    id: b.id,
    status: b.status,
    isAttending: b.isAttending,
    firstName: b.firstName,
    lastName: b.lastName,
    location: b.location,
    reservationFirstName: b.reservationFirstName,
    reservationLastName: b.reservationLastName,
    nameTag: b.nameTag ?? "",
    hotelEmail: b.hotelEmail,
    detailsEmail: b.detailsEmail,
    cuestaEmail: b.cuestaEmail,
    attendingHappyHour: b.attendingHappyHour,
    attendingAllHands: b.attendingAllHands,
    attendingDinner: b.attendingDinner,
    stayStart: b.isAttending ? toISODate(b.stayStart) : "",
    stayEnd: b.isAttending ? toISODate(b.stayEnd) : "",
    nightsTotal: nights.length,
    nightsCompanyPaid: nights.filter((n) => companyPaid.has(n)).length,
    nightsSelfPaid: nights.filter((n) => !companyPaid.has(n)).length,
    nightsCompanyPaidDates: nights.filter((n) => companyPaid.has(n)).join("; "),
    nightsSelfPaidDates: nights.filter((n) => !companyPaid.has(n)).join("; "),
    extraNightsRoomType: b.extraNightsRoomType ?? "",
    ptoDates: parseJsonArray(b.ptoDates).join("; "),
    additionalGuests: b.guests
      .map((g) => {
        const events = [g.attendingHappyHour && "HH", g.attendingDinner && "Dinner"]
          .filter(Boolean)
          .join("+");
        const diet = parseJsonArray(g.dietaryOptions).join("/");
        return `${g.firstName} ${g.lastName} (${g.type}${events ? `, ${events}` : ""}${diet ? `, diet: ${diet}` : ""})`;
      })
      .join("; "),
    dietaryOptions: parseJsonArray(b.dietaryOptions).join("; "),
    dietaryOther: b.dietaryOther ?? "",
    flightArrivalAirline: b.flightArrivalAirline ?? "",
    flightArrivalNumber: b.flightArrivalNumber ?? "",
    flightArrival: b.flightArrival ? b.flightArrival.toISOString() : "",
    flightDepartureAirline: b.flightDepartureAirline ?? "",
    flightDepartureNumber: b.flightDepartureNumber ?? "",
    flightDeparture: b.flightDeparture ? b.flightDeparture.toISOString() : "",
    flightNotes: b.flightNotes ?? "",
    additionalNotes: b.additionalNotes ?? "",
    flaggedForReview: b.flaggedForReview,
    flagReason: b.flagReason ?? "",
    cancelledAt: b.cancelledAt ? b.cancelledAt.toISOString() : "",
    cancelledByAdmin: b.cancelledByAdmin,
    magicLinkToken: b.magicLinkToken,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

/** A clean, hotel-facing subset: just enough for them to build a rooming
 *  list, nothing internal (dietary, flight, PTO, admin flags, links). Only
 *  ever includes people actually attending, since that's who the hotel
 *  needs a room for. */
function hotelRow(b: BookingWithGuests) {
  const nights = bookingNights(b);
  const roomType = b.extraNightsRoomType
    ? (ROOM_TYPES.find((rt) => rt.key === b.extraNightsRoomType)?.label ?? b.extraNightsRoomType)
    : "Standard block rate";
  return {
    reservationFirstName: b.reservationFirstName,
    reservationLastName: b.reservationLastName,
    checkIn: toISODate(b.stayStart),
    checkOut: toISODate(b.stayEnd),
    nights: nights.length,
    roomType,
    totalOccupants: 1 + b.guests.length,
    additionalGuestNames: b.guests.map((g) => `${g.firstName} ${g.lastName}`).join("; "),
    contactEmail: b.hotelEmail,
  };
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Record<string, unknown>[],
  changeStates: ChangeState[],
  legend: string,
) {
  const sheet = workbook.addWorksheet(name);

  if (rows.length === 0) {
    sheet.addRow(["No bookings in this category."]);
    return;
  }

  const headers = Object.keys(rows[0]);

  const legendRow = sheet.addRow([legend]);
  sheet.mergeCells(legendRow.number, 1, legendRow.number, headers.length);
  legendRow.font = { italic: true, size: 9, color: { argb: "FF6B7280" } };

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });

  rows.forEach((row, i) => {
    const excelRow = sheet.addRow(headers.map((h) => row[h] as ExcelJS.CellValue));
    const state = changeStates[i];
    if (state === "new") excelRow.eachCell((cell) => (cell.fill = NEW_FILL));
    else if (state === "changed") excelRow.eachCell((cell) => (cell.fill = CHANGED_FILL));
  });

  sheet.columns.forEach((col) => {
    col.width = 16;
  });
  sheet.views = [{ state: "frozen", ySplit: 2 }];
}

/** Builds the admin export workbook: one sheet to hand to the hotel
 *  (attendees only, reservation-focused columns), and two full-detail
 *  sheets for the team (everyone, and just those not attending). Rows
 *  created or updated since `since` (the last time anyone exported) are
 *  highlighted green/yellow so changes are easy to spot before re-sending
 *  to the hotel. */
export function buildExportWorkbook(bookings: BookingWithGuests[], since: Date | null): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const legend = since
    ? `Green = new since your last pull (${since.toISOString().slice(0, 16).replace("T", " ")} UTC). Yellow = changed since then. No color = unchanged.`
    : "This is the first pull on record, so nothing is highlighted yet - your next pull will highlight what's new or changed since this one.";

  const attending = bookings.filter((b) => b.isAttending && b.status === "ACTIVE");
  const notAttending = bookings.filter((b) => !b.isAttending);

  addSheet(
    workbook,
    "For Hotel",
    attending.map(hotelRow),
    attending.map((b) => changeStateOf(b, since)),
    legend,
  );
  addSheet(
    workbook,
    "All Bookings",
    bookings.map(fullRow),
    bookings.map((b) => changeStateOf(b, since)),
    legend,
  );
  addSheet(
    workbook,
    "Not Attending",
    notAttending.map(fullRow),
    notAttending.map((b) => changeStateOf(b, since)),
    legend,
  );

  return workbook;
}
