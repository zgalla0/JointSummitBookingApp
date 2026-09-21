import ExcelJS from "exceljs";
import type { RosterComparison, RosterRow } from "./roster-compare";
import { addSimpleSheet } from "./workbook-helpers";

// Mirrors exactly the columns shown on the Roster check page for these two
// tables (no start date, no location) - so the export never shows more
// than what's already visible on screen.
function rosterRowForExport(r: RosterRow) {
  return {
    name: r.employeeName,
    title: r.title,
    employmentType: r.employmentType,
    workEmail: r.cuestaEmail,
  };
}

/** The three tables shown on the Roster check page, each as its own
 *  sheet - the same split the page itself computes, so the export always
 *  matches what's on screen. */
export function buildRosterComparisonWorkbook(comparison: RosterComparison): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const options = { emptyMessage: "Nobody in this category.", columnWidth: 22 };
  addSimpleSheet(workbook, "Havent Submitted", comparison.missingFromForm.map(rosterRowForExport), options);
  addSimpleSheet(workbook, "Has Submitted", comparison.hasSubmittedForm.map(rosterRowForExport), options);
  addSimpleSheet(workbook, "Not On Roster", comparison.submittedNotOnRoster, options);

  return workbook;
}
