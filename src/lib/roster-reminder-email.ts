// Pure functions only (no server-only imports) - this is shared between the
// admin's editable preview (client component) and the actual send (server
// route/email.ts), so what an admin previews and edits is exactly what
// goes out, with {{first_name}} substituted per recipient at send time.

export function defaultRosterReminderTemplate(): string {
  return [
    "Hi {{first_name}},",
    "",
    "Just a friendly reminder, we don't have a response from you yet for the Q1 Joint All Hands Summit Attendance and Hotel Booking form. Whether you're planning to attend or not, we'd appreciate you filling it out so we can plan accordingly.",
    "",
    "If you already submitted this and think you're seeing this by mistake, double check that the email you used on the form matches your Cuesta email in Rippling exactly, we're comparing against that to confirm submissions.",
    "",
    "Just a heads up, if the form isn't filled out, we won't be able to hold a hotel room for you at the summit.",
    "",
    "Thanks so much!",
    "Q1 Summit Planning Team",
  ].join("\n");
}

export function renderRosterReminder(template: string, firstName: string): string {
  return template.replaceAll("{{first_name}}", firstName || "there");
}
