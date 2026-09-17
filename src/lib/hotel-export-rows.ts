import { computeHotelExportFields, type ClassifiedRow } from "./hotel-export-diff";

export type HotelExportCategory = "New" | "Edited" | "Cancelled";

export type HotelExportRowData = ReturnType<typeof computeHotelExportFields> & {
  status: HotelExportCategory;
  whatChanged: string;
};

/** One row of the Hotel Export, shaped identically whether it ends up
 *  rendered as an in-browser preview table or written into the downloaded
 *  workbook - so what an admin previews is exactly what gets sent. */
export type HotelExportPreviewRow = {
  category: HotelExportCategory;
  /** Column keys (matching `data`'s keys) to highlight - empty means
   *  highlight the whole row (New/Cancelled rows, and Edited rows where no
   *  prior snapshot exists to diff against at all). */
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

/** Turns a classification into the exact row list both the "Pull" preview
 *  and the hotel export workbook are built from, so there's only one place
 *  that decides what a row looks like and which cells count as changed. */
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
