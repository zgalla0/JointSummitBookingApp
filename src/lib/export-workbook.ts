import ExcelJS from "exceljs";
import type { Booking, BookingGuest } from "@prisma/client";
import { toISODate } from "./format";
import { parseJsonArray, bookingNights } from "./admin-stats";
import { ROOM_TYPES } from "./room-types";
import { addSimpleSheet } from "./workbook-helpers";

type BookingWithGuests = Booking & { guests: BookingGuest[] };

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

/** A clean, reservation-focused subset (not the hotel-facing "Send to
 *  Hotel" export - just a quicker-to-scan view of the same attending
 *  bookings for internal reference). Only ever includes people actually
 *  attending, since that's who has a room at all. */
function attendingSummaryRow(b: BookingWithGuests) {
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

/** Builds the "View All Data" workbook: the complete, unfiltered dataset
 *  (a reservation-focused summary of attendees, every booking in full
 *  detail, and everyone not attending) for internal reference and
 *  troubleshooting. No diffing, no highlighting, no log required - that's
 *  what the separate "Send to Hotel" export is for. */
export function buildExportWorkbook(bookings: BookingWithGuests[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const attending = bookings.filter((b) => b.isAttending && b.status === "ACTIVE");
  const notAttending = bookings.filter((b) => !b.isAttending);

  const emptyMessage = "No bookings in this category.";
  addSimpleSheet(workbook, "All Bookings", bookings.map(fullRow), { emptyMessage, columnWidth: 16 });
  addSimpleSheet(workbook, "Attending Summary", attending.map(attendingSummaryRow), {
    emptyMessage,
    columnWidth: 16,
  });
  addSimpleSheet(workbook, "Not Attending", notAttending.map(fullRow), { emptyMessage, columnWidth: 16 });

  return workbook;
}
