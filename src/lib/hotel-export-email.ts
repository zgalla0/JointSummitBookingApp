import type { HotelExportPreviewRow } from "./hotel-export-rows";

function bookingName(row: HotelExportPreviewRow): string {
  return `${row.data.reservationFirstName} ${row.data.reservationLastName}`;
}

/** Full draft email body for the admin to copy into their own email
 *  client, attach the downloaded workbook to, and send themselves - this
 *  app never emails the hotel automatically. Lists every changed booking
 *  by name (and, for edits, what changed) rather than just a bare count,
 *  so the draft alone gives the hotel a real overview without them having
 *  to open the attachment first. */
export function buildHotelExportDraftEmail(rows: HotelExportPreviewRow[]): string {
  const newRows = rows.filter((r) => r.category === "New");
  const editedRows = rows.filter((r) => r.category === "Edited");
  const cancelledRows = rows.filter((r) => r.category === "Cancelled");

  const sections: string[] = [];

  if (newRows.length > 0) {
    sections.push(
      [`New booking${newRows.length === 1 ? "" : "s"}:`, ...newRows.map((r) => `- ${bookingName(r)}`)].join("\n"),
    );
  }
  if (editedRows.length > 0) {
    sections.push(
      [
        `Edited booking${editedRows.length === 1 ? "" : "s"}:`,
        ...editedRows.map((r) => `- ${bookingName(r)}: ${r.data.whatChanged}`),
      ].join("\n"),
    );
  }
  if (cancelledRows.length > 0) {
    sections.push(
      [`Cancellation${cancelledRows.length === 1 ? "" : "s"}:`, ...cancelledRows.map((r) => `- ${bookingName(r)}`)].join(
        "\n",
      ),
    );
  }

  const changesBlock = sections.length > 0 ? sections.join("\n\n") : "No changes since the last update.";

  return [
    "Hi [Hotel contact name],",
    "",
    "We have an updated list of our bookings. Here is an overview of the changes that are in the excel attached:",
    "",
    changesBlock,
    "",
    "Thanks,",
    "[Your name]",
  ].join("\n");
}
