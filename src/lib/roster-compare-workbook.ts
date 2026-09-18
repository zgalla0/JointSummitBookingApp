import ExcelJS from "exceljs";
import type { RosterComparison } from "./roster-compare";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

function addSheet(workbook: ExcelJS.Workbook, name: string, rows: Record<string, unknown>[]) {
  const sheet = workbook.addWorksheet(name);

  if (rows.length === 0) {
    sheet.addRow(["Nobody in this category."]);
    return;
  }

  const headers = Object.keys(rows[0]);
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });

  rows.forEach((row) => {
    sheet.addRow(headers.map((h) => row[h] as ExcelJS.CellValue));
  });

  sheet.columns.forEach((col) => {
    col.width = 22;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

/** The three tables shown on the Roster check page, each as its own
 *  sheet - the same split the page itself computes, so the export always
 *  matches what's on screen. */
export function buildRosterComparisonWorkbook(comparison: RosterComparison): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  addSheet(workbook, "Havent Submitted", comparison.missingFromForm);
  addSheet(workbook, "Has Submitted", comparison.hasSubmittedForm);
  addSheet(workbook, "Not On Roster", comparison.submittedNotOnRoster);

  return workbook;
}
