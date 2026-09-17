import { toISODate } from "./format";
import { bookingNights, parseJsonArray } from "./admin-stats";
import { ROOM_TYPES } from "./room-types";
import type { ClassifiedRow } from "./hotel-export-diff";

export type HotelExportCategory = "New" | "Edited" | "Cancelled";

export type HotelExportRowData = {
  status: HotelExportCategory;
  whatChanged: string;
  reservationFirstName: string;
  reservationLastName: string;
  nameTag: string;
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

/** One row of the Hotel Export, shaped identically whether it ends up
 *  rendered as an in-browser preview table or written into the downloaded
 *  workbook - so what an admin previews is exactly what gets sent. */
export type HotelExportPreviewRow = {
  category: HotelExportCategory;
  /** Column keys (matching `data`'s keys) to highlight - empty means
   *  highlight the whole row (New/Cancelled rows, and Edited rows where the
   *  specific changed field(s) couldn't be pinned down). */
  highlightFields: string[];
  data: HotelExportRowData;
};

function rowData(row: ClassifiedRow, category: HotelExportCategory): HotelExportRowData {
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

/** Turns a classification into the exact row list both the "Pull" preview
 *  and the "Send to Hotel" workbook are built from, so there's only one
 *  place that decides what a row looks like and which cells count as
 *  changed. */
export function buildHotelExportRows(
  newRows: ClassifiedRow[],
  editedRows: ClassifiedRow[],
  cancelledRows: ClassifiedRow[],
): HotelExportPreviewRow[] {
  return [
    ...newRows.map((r) => ({ category: "New" as const, highlightFields: [], data: rowData(r, "New") })),
    ...editedRows.map((r) => ({
      category: "Edited" as const,
      highlightFields: r.changedFields && r.changedFields.length > 0 ? [...r.changedFields, "whatChanged"] : [],
      data: rowData(r, "Edited"),
    })),
    ...cancelledRows.map((r) => ({ category: "Cancelled" as const, highlightFields: [], data: rowData(r, "Cancelled") })),
  ];
}
