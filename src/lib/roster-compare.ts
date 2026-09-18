import ExcelJS from "exceljs";

export type RosterRow = {
  startDate: string;
  employeeName: string;
  title: string;
  employmentType: string;
  cuestaEmail: string;
  country: string;
  state: string;
};

export type BookingEmailEntry = {
  bookingId: string;
  name: string;
  cuestaEmail: string;
};

export type RosterComparison = {
  /** On the roster, but no active booking uses that email. */
  missingFromForm: RosterRow[];
  /** On the roster, and an active booking already uses that email. */
  hasSubmittedForm: RosterRow[];
  /** Has an active booking, but that email isn't on the roster. */
  submittedNotOnRoster: BookingEmailEntry[];
  rosterRowCount: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  return tabCount > commaCount ? "\t" : ",";
}

/** Minimal RFC4180-ish line splitter: handles quoted fields (with escaped
 *  "" inside) so a stray comma inside a quoted cell doesn't break columns,
 *  without pulling in a whole CSV parsing library for what's expected to be
 *  a clean HR export. */
function parseDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseDelimitedText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => parseDelimitedLine(line, delimiter));
}

async function parseXlsxRows(buffer: Buffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  const rows: string[][] = [];
  sheet?.eachRow((row) => {
    const values = row.values as ExcelJS.CellValue[];
    // ExcelJS's row.values is 1-indexed with a throwaway slot at index 0.
    rows.push(values.slice(1).map((v) => (v == null ? "" : String(v).trim())));
  });
  return rows;
}

/** Finds the column index whose header matches a predicate, so real-world
 *  header text ("Start date as employee (non-contractor)") doesn't need an
 *  exact match - just a distinguishing substring. */
function findColumn(headers: string[], predicate: (headerLower: string) => boolean): number {
  return headers.findIndex((h) => predicate(h.trim().toLowerCase()));
}

function rowsToRoster(rows: string[][]): RosterRow[] {
  if (rows.length === 0) return [];
  const [headerRow, ...dataRows] = rows;

  const startDateCol = findColumn(headerRow, (h) => h.includes("start date"));
  const nameCol = findColumn(headerRow, (h) => h === "employee" || h.includes("employee name"));
  const titleCol = findColumn(headerRow, (h) => h === "title");
  const employmentTypeCol = findColumn(headerRow, (h) => h.includes("employment type"));
  const emailCol = findColumn(headerRow, (h) => h.includes("email"));
  const countryCol = findColumn(headerRow, (h) => h.includes("country"));
  const stateCol = findColumn(headerRow, (h) => h.includes("state"));

  const get = (row: string[], idx: number) => (idx >= 0 ? (row[idx] ?? "") : "");

  return dataRows
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => ({
      startDate: get(row, startDateCol),
      employeeName: get(row, nameCol),
      title: get(row, titleCol),
      employmentType: get(row, employmentTypeCol),
      cuestaEmail: get(row, emailCol),
      country: get(row, countryCol),
      state: get(row, stateCol),
    }));
}

/** Parses an uploaded roster document - .xlsx via ExcelJS, .csv/.tsv via a
 *  lightweight delimited-text parser - into roster rows keyed by header
 *  name rather than fixed column position, since HR exports can reorder
 *  columns between pulls. */
export async function parseRosterFile(fileName: string, buffer: Buffer): Promise<RosterRow[]> {
  const isSpreadsheet = /\.xlsx$/i.test(fileName);
  const rows = isSpreadsheet ? await parseXlsxRows(buffer) : parseDelimitedText(buffer.toString("utf-8"));
  return rowsToRoster(rows);
}

/** Best-effort first name for a reminder email's greeting, from whatever
 *  format the roster's name column happens to use - "Last, First" (common
 *  in HR exports) or "First Last". Falls back to "there" for a blank name. */
export function guessFirstName(employeeName: string): string {
  const trimmed = employeeName.trim();
  if (!trimmed) return "there";
  const commaIndex = trimmed.indexOf(",");
  const namePart = commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
  return namePart.trim().split(/\s+/)[0] || "there";
}

/** Compares the uploaded roster against every currently-active booking's
 *  Cuesta email (case/whitespace-insensitive), in both directions: who's
 *  on the roster but hasn't submitted the form, and who's submitted the
 *  form with an email that isn't on the roster (typo, contractor not yet
 *  added, etc). */
export function compareRosterToBookings(
  roster: RosterRow[],
  bookings: BookingEmailEntry[],
): RosterComparison {
  const bookingEmails = new Set(
    bookings.map((b) => normalizeEmail(b.cuestaEmail)).filter((e) => e !== ""),
  );
  const rosterEmails = new Set(
    roster.map((r) => normalizeEmail(r.cuestaEmail)).filter((e) => e !== ""),
  );

  const missingFromForm = roster.filter(
    (r) => r.cuestaEmail !== "" && !bookingEmails.has(normalizeEmail(r.cuestaEmail)),
  );
  const hasSubmittedForm = roster.filter(
    (r) => r.cuestaEmail !== "" && bookingEmails.has(normalizeEmail(r.cuestaEmail)),
  );
  const submittedNotOnRoster = bookings.filter(
    (b) => b.cuestaEmail !== "" && !rosterEmails.has(normalizeEmail(b.cuestaEmail)),
  );

  return { missingFromForm, hasSubmittedForm, submittedNotOnRoster, rosterRowCount: roster.length };
}
