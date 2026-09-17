import ExcelJS from "exceljs";
import { toISODate } from "./format";
import { bookingNights, parseJsonArray } from "./admin-stats";
import { ROOM_TYPES } from "./room-types";
import type { ClassifiedRow } from "./hotel-export-diff";

type Category = "New" | "Edited" | "Cancelled";

const NEW_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } };
const EDITED_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
const CANCELLED_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } };
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

function fillFor(category: Category): ExcelJS.Fill {
  if (category === "New") return NEW_FILL;
  if (category === "Edited") return EDITED_FILL;
  return CANCELLED_FILL;
}

function hotelRow(row: ClassifiedRow, category: Category) {
  const b = row.booking;
  const nights = bookingNights(b);
  const companyPaid = new Set(parseJsonArray(b.companyPaidNights));
  const roomType = b.extraNightsRoomType
    ? (ROOM_TYPES.find((rt) => rt.key === b.extraNightsRoomType)?.label ?? b.extraNightsRoomType)
    : "Standard block rate";

  return {
    status: category,
    whatChanged: row.whatChanged ?? "",
    reservationFirstName: b.reservationFirstName,
    reservationLastName: b.reservationLastName,
    nameTag: b.nameTag ?? "",
    checkIn: toISODate(b.stayStart),
    checkOut: toISODate(b.stayEnd),
    nights: nights.length,
    nightsCompanyPaid: nights.filter((n) => companyPaid.has(n)).length,
    nightsSelfPaid: nights.filter((n) => !companyPaid.has(n)).length,
    roomType,
    totalOccupants: 1 + b.guests.length,
    additionalGuestNames: b.guests.map((g) => `${g.firstName} ${g.lastName}`).join("; "),
    contactEmail: b.hotelEmail,
  };
}

/** Builds the Hotel Export workbook: a single sheet listing only the
 *  bookings the hotel actually needs to hear about (new, edited, or
 *  cancelled since the last pull), color-coded per category, with a "What
 *  changed" column for edited rows - never a full re-dump of every booking.
 *  New/Cancelled rows highlight in full (the whole booking is what's new or
 *  gone); Edited rows highlight only the specific cell(s) that changed, so
 *  e.g. a single updated stay date doesn't paint the whole row. */
export function buildHotelExportWorkbook(
  newRows: ClassifiedRow[],
  editedRows: ClassifiedRow[],
  cancelledRows: ClassifiedRow[],
  since: Date | null,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Hotel Export");

  const legendText = since
    ? `Changes since ${since.toISOString().slice(0, 16).replace("T", " ")} UTC. Green = new, yellow = edited, red = cancelled.`
    : "First-ever pull - everything below is new to the hotel. Green = new, yellow = edited, red = cancelled.";
  const legendRow = sheet.addRow([legendText]);
  legendRow.font = { italic: true, size: 9, color: { argb: "FF6B7280" } };

  const rows: Array<{
    category: Category;
    row: ReturnType<typeof hotelRow>;
    /** Only these column keys get filled, instead of the whole row -
     *  undefined means "highlight the whole row" (New/Cancelled rows, and
     *  Edited rows where the specific changed field(s) couldn't be
     *  determined). */
    highlightFields?: Set<string>;
  }> = [
    ...newRows.map((r) => ({ category: "New" as const, row: hotelRow(r, "New") })),
    ...editedRows.map((r) => ({
      category: "Edited" as const,
      row: hotelRow(r, "Edited"),
      highlightFields:
        r.changedFields && r.changedFields.length > 0 ? new Set([...r.changedFields, "whatChanged"]) : undefined,
    })),
    ...cancelledRows.map((r) => ({ category: "Cancelled" as const, row: hotelRow(r, "Cancelled") })),
  ];

  if (rows.length === 0) {
    const emptyRow = sheet.addRow(["No new, edited, or cancelled bookings in this window."]);
    sheet.mergeCells(legendRow.number, 1, legendRow.number, 12);
    sheet.mergeCells(emptyRow.number, 1, emptyRow.number, 12);
    return workbook;
  }

  const headers = Object.keys(rows[0].row);
  sheet.mergeCells(legendRow.number, 1, legendRow.number, headers.length);

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });

  rows.forEach(({ category, row, highlightFields }) => {
    const excelRow = sheet.addRow(headers.map((h) => row[h as keyof typeof row] as ExcelJS.CellValue));
    const fill = fillFor(category);
    if (!highlightFields) {
      excelRow.eachCell((cell) => (cell.fill = fill));
    } else {
      headers.forEach((header, i) => {
        if (highlightFields.has(header)) {
          excelRow.getCell(i + 1).fill = fill;
        }
      });
    }
  });

  sheet.columns.forEach((col) => {
    col.width = 18;
  });
  sheet.views = [{ state: "frozen", ySplit: 2 }];

  return workbook;
}
