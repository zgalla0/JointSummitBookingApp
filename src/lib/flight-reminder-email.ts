// Pure functions only (no server-only imports, e.g. magic-link.ts's use of
// "crypto") - this is shared between the admin's editable preview (client
// component) and the actual send (server route/email.ts), so what an admin
// previews and edits is exactly what goes out, with {{first_name}} and
// {{magic_link}} substituted per recipient at send time.

export function defaultFlightReminderTemplate(): string {
  return [
    "Hi {{first_name}},",
    "",
    "We're still missing your flight details for the Q1 Joint All Hands Summit. If you haven't booked your flight yet, please book it ASAP so we can plan accordingly. If you've already booked but just haven't added the details here yet, please add them in now so we can help coordinate airport pickups and carpools.",
    "",
    "Here's your magic link to add the information:",
    "{{magic_link}}",
    "",
    "Thanks,",
    "Q1 Summit Planning Team",
  ].join("\n");
}

export function renderFlightReminder(template: string, firstName: string, magicLink: string): string {
  return template.replaceAll("{{first_name}}", firstName || "there").replaceAll("{{magic_link}}", magicLink);
}
