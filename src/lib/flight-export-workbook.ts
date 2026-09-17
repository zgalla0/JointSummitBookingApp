import ExcelJS from "exceljs";
import type { FlightGroup } from "./flight-groups";
import { terminalLabel } from "./airport-terminals";
import { formatMonthDay } from "./format";

const GROUP_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };

const COLUMNS = ["Name", "Airline", "Flight #", "Time (UTC)"];

function addLegSheet(workbook: ExcelJS.Workbook, name: string, groups: FlightGroup[]) {
  const sheet = workbook.addWorksheet(name);

  if (groups.length === 0) {
    sheet.addRow(["No flight details on file yet."]);
    return;
  }

  groups.forEach((group) => {
    const groupRow = sheet.addRow([
      `${formatMonthDay(group.dateIso)} - ${terminalLabel(group.terminal)} - ${group.entries.length} ${
        group.entries.length === 1 ? "person" : "people"
      }`,
    ]);
    sheet.mergeCells(groupRow.number, 1, groupRow.number, COLUMNS.length);
    groupRow.font = { bold: true };
    groupRow.eachCell((cell) => (cell.fill = GROUP_FILL));

    const headerRow = sheet.addRow(COLUMNS);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => (cell.fill = HEADER_FILL));

    group.entries.forEach((entry) => {
      sheet.addRow([entry.name, entry.airline, entry.flightNumber || "-", entry.dateTime.toISOString().slice(11, 16)]);
    });

    sheet.addRow([]);
  });

  sheet.columns.forEach((col) => {
    col.width = 24;
  });
}

/** Builds the Flights export workbook - one sheet each for Arrivals and
 *  Departures, with the exact same date/terminal grouping shown on the
 *  admin Flights page (via computeFlightGroups), so the exported file
 *  mirrors what's on screen rather than being a flat re-dump. */
export function buildFlightExportWorkbook(arrivals: FlightGroup[], departures: FlightGroup[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  addLegSheet(workbook, "Arrivals", arrivals);
  addLegSheet(workbook, "Departures", departures);

  return workbook;
}
