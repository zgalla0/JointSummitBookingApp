import ExcelJS from "exceljs";

export const WORKBOOK_HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE5E7EB" },
};

/** Adds a worksheet with a bold, filled header row followed by one row per
 *  entry - the shared shape behind every "flat table" Excel export (View
 *  All Data, Roster check). Sheets with a bespoke layout (per-row
 *  highlighting, grouped sections) build their own instead. */
export function addSimpleSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Record<string, unknown>[],
  options: { emptyMessage: string; columnWidth: number },
): void {
  const sheet = workbook.addWorksheet(name);

  if (rows.length === 0) {
    sheet.addRow([options.emptyMessage]);
    return;
  }

  const headers = Object.keys(rows[0]);
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = WORKBOOK_HEADER_FILL;
  });

  rows.forEach((row) => {
    sheet.addRow(headers.map((h) => row[h] as ExcelJS.CellValue));
  });

  sheet.columns.forEach((col) => {
    col.width = options.columnWidth;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}
