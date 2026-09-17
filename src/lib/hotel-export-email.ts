/** Full draft email body for the admin to copy into their own email
 *  client, attach the downloaded workbook to, and send themselves - this
 *  app never emails the hotel automatically. Keeps to a high-level count
 *  per category (the spreadsheet itself, color-coded and highlighted down
 *  to the changed cell, is where the per-booking detail lives). */
export function buildHotelExportDraftEmail(counts: {
  newCount: number;
  editedCount: number;
  cancelledCount: number;
}): string {
  const bullets = [
    `${counts.newCount} new booking${counts.newCount === 1 ? "" : "s"}`,
    `${counts.editedCount} edited booking${counts.editedCount === 1 ? "" : "s"}`,
    `${counts.cancelledCount} cancellation${counts.cancelledCount === 1 ? "" : "s"}`,
  ];

  return [
    "Hi [Hotel contact name],",
    "",
    "Attached is our updated booking list for the Q1 Summit. Here's a quick summary of what's changed since our last update:",
    "",
    ...bullets.map((b) => `* ${b}`),
    "",
    "Details for each are highlighted in the attached spreadsheet, new bookings, edits, and cancellations are marked separately so they're easy to spot.",
    "",
    "Let us know if you have any questions.",
    "",
    "Thanks,",
    "[Your name]",
  ].join("\n");
}
