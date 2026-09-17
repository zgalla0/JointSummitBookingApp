import ExcelJS from "exceljs";
import type { HotelExportCategory, HotelExportPreviewRow } from "./hotel-export-rows";

const NEW_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } };
const EDITED_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
const CANCELLED_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } };
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

function fillFor(category: HotelExportCategory): ExcelJS.Fill {
  if (category === "New") return NEW_FILL;
  if (category === "Edited") return EDITED_FILL;
  return CANCELLED_FILL;
}

/** Builds the Hotel Export workbook from the same row list shown in the
 *  "Pull" preview - a single sheet listing only the bookings the hotel
 *  actually needs to hear about (new, edited, or cancelled since the last
 *  send), color-coded per category, with a "What changed" column for
 *  edited rows - never a full re-dump of every booking. New/Cancelled rows
 *  highlight in full (the whole booking is what's new or gone); Edited
 *  rows highlight only the specific cell(s) that changed, so e.g. a single
 *  updated stay date doesn't paint the whole row. */
export function buildHotelExportWorkbook(rows: HotelExportPreviewRow[], since: Date | null): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Hotel Export");

  const legendText = since
    ? `Changes since ${since.toISOString().slice(0, 16).replace("T", " ")} UTC. Green = new, yellow = edited, red = cancelled.`
    : "First-ever pull - everything below is new to the hotel. Green = new, yellow = edited, red = cancelled.";
  const legendRow = sheet.addRow([legendText]);
  legendRow.font = { italic: true, size: 9, color: { argb: "FF6B7280" } };

  if (rows.length === 0) {
    const emptyRow = sheet.addRow(["No new, edited, or cancelled bookings in this window."]);
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
    const fill = fillFor(category);
    if (highlightFields.length === 0) {
      excelRow.eachCell((cell) => (cell.fill = fill));
    } else {
      headers.forEach((header, i) => {
        if (highlightFields.includes(header)) {
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
