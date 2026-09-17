import ExcelJS from "exceljs";
import type { HotelExportPreviewRow } from "./hotel-export-rows";

const NEW_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9F2D9" } };
const CANCELLED_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7D7" } };
const EDITED_CELL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF3C7" } };
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

/** Builds the Hotel Export workbook from the same row list shown in the
 *  "Pull" preview - the full current roster (every active, attending
 *  booking, plus any not-yet-cleared cancellation), so the hotel always has
 *  an accurate complete picture, not just a diff. Highlighting layers on
 *  top, in strict priority order and never blending two colors on one
 *  row/cell:
 *   1. New since the last export -> whole row green.
 *   2. Cancelled (and not yet cleared) -> whole row red.
 *   3. Edited (existed before, still active, something changed) -> row
 *      stays white; only the specific changed cell(s) (plus "What changed")
 *      go yellow.
 *   4. Otherwise unchanged -> row stays white, nothing highlighted.
 */
export function buildHotelExportWorkbook(rows: HotelExportPreviewRow[], since: Date | null): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Hotel Export");

  const legendText = since
    ? "Full current roster. Green = new since last export, yellow highlighted cells = changed since last export, red = cancelled (not yet cleared), white = unchanged."
    : "First-ever pull - full current roster, everything below is new to the hotel. Green = new, yellow = edited, red = cancelled, white = unchanged.";
  const legendRow = sheet.addRow([legendText]);
  legendRow.font = { italic: true, size: 9, color: { argb: "FF6B7280" } };

  if (rows.length === 0) {
    const emptyRow = sheet.addRow(["No bookings on file yet."]);
    sheet.mergeCells(legendRow.number, 1, legendRow.number, 12);
    sheet.mergeCells(emptyRow.number, 1, emptyRow.number, 12);
    return workbook;
  }

  const headers = Object.keys(rows[0].data);
  sheet.mergeCells(legendRow.number, 1, legendRow.number, headers.length);

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });

  rows.forEach(({ category, data, highlightFields }) => {
    const excelRow = sheet.addRow(headers.map((h) => data[h as keyof typeof data] as ExcelJS.CellValue));
    if (category === "New") {
      excelRow.eachCell((cell) => (cell.fill = NEW_FILL));
    } else if (category === "Cancelled") {
      excelRow.eachCell((cell) => (cell.fill = CANCELLED_FILL));
    } else if (category === "Edited") {
      headers.forEach((header, i) => {
        if (highlightFields.includes(header)) {
          excelRow.getCell(i + 1).fill = EDITED_CELL_FILL;
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
