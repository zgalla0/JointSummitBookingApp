import { computeHotelExportFields, type ClassifiedRow } from "./hotel-export-diff";

type HotelExportCategory = "New" | "Edited" | "Unchanged" | "Cancelled";

type HotelExportRowData = ReturnType<typeof computeHotelExportFields> & {
  status: HotelExportCategory;
  whatChanged: string;
};

/** One row of the Hotel Export, shaped identically whether it ends up
 *  rendered as an in-browser preview table or written into the downloaded
 *  workbook - so what an admin previews is exactly what gets sent. Every
 *  currently-relevant booking gets a row (the hotel needs the full roster
 *  each time); `category` and `highlightFields` say how (or whether) to
 *  color it - see buildHotelExportRows below for the exact rule. */
export type HotelExportPreviewRow = {
  category: HotelExportCategory;
  bookingId: string;
  /** Only meaningful for "Edited" rows: the column keys (matching `data`'s
   *  keys, plus "whatChanged") to highlight yellow. New/Cancelled rows are
   *  colored as a whole row instead (see below), and Unchanged rows are
   *  never highlighted, so this is always [] for those. */
  highlightFields: string[];
  data: HotelExportRowData;
};

function rowData(row: ClassifiedRow, category: HotelExportCategory): HotelExportRowData {
  return {
    status: category,
    whatChanged: row.whatChanged ?? "",
    ...computeHotelExportFields(row.booking),
  };
}

function rowEntry(row: ClassifiedRow, category: HotelExportCategory): HotelExportPreviewRow {
  return {
    category,
    bookingId: row.booking.id,
    // New/Cancelled: colored as a whole row, so no individual cells to list.
    // Edited: exactly the columns that changed, plus the "what changed" cell
    // itself. Unchanged: nothing.
    highlightFields: category === "Edited" ? [...(row.changedFields ?? []), "whatChanged"] : [],
    data: rowData(row, category),
  };
}

/** Turns a classification into the full roster row list both the "Pull"
 *  preview and the hotel export workbook are built from, so there's only
 *  one place that decides what a row looks like and which cells count as
 *  changed. Sorted alphabetically (by reservation name) since this is now
 *  a full roster to review, not a short list grouped by what changed. */
export function buildHotelExportRows(
  newRows: ClassifiedRow[],
  editedRows: ClassifiedRow[],
  unchangedRows: ClassifiedRow[],
  cancelledRows: ClassifiedRow[],
): HotelExportPreviewRow[] {
  const rows: HotelExportPreviewRow[] = [
    ...newRows.map((r) => rowEntry(r, "New")),
    ...editedRows.map((r) => rowEntry(r, "Edited")),
    ...unchangedRows.map((r) => rowEntry(r, "Unchanged")),
    ...cancelledRows.map((r) => rowEntry(r, "Cancelled")),
  ];

  rows.sort((a, b) => {
    const nameA = `${a.data.reservationLastName} ${a.data.reservationFirstName}`.toLowerCase();
    const nameB = `${b.data.reservationLastName} ${b.data.reservationFirstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return rows;
}
