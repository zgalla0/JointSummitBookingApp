import { NextResponse, type NextRequest } from "next/server";
import { sendFormReminderEmail } from "@/lib/email";
import { defaultRosterReminderTemplate, renderRosterReminder } from "@/lib/roster-reminder-email";

type Recipient = { email: string; firstName: string };

// The roster comparison isn't persisted server-side (nothing is uploaded/
// stored - it only ever lived in the browser's response from
// /api/admin/roster-check), so unlike /api/admin/flight-reminder this
// route takes its recipient list from the request body instead of
// re-querying the database.
function parseRecipients(value: unknown): Recipient[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const email = typeof (entry as { email?: unknown })?.email === "string" ? (entry as { email: string }).email.trim() : "";
      const firstName =
        typeof (entry as { firstName?: unknown })?.firstName === "string"
          ? (entry as { firstName: string }).firstName.trim()
          : "";
      return { email, firstName };
    })
    .filter((r) => r.email);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const recipients = parseRecipients((body as { recipients?: unknown })?.recipients);
  const rawTemplate = (body as { template?: unknown })?.template;
  const template = typeof rawTemplate === "string" && rawTemplate.trim() ? rawTemplate : defaultRosterReminderTemplate();

  for (const r of recipients) {
    await sendFormReminderEmail({ to: r.email, body: renderRosterReminder(template, r.firstName || "there") });
  }

  return NextResponse.json({ sent: recipients.length });
}
