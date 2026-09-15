// Email sending is wired up in Stage 4. For now these are stubs so the rest
// of the app can call them at the right trigger points; each just logs what
// it would have sent.

type BookingEmailData = {
  to: string;
  firstName: string;
  magicLink: string;
};

function logStubEmail(kind: string, data: Record<string, unknown>) {
  console.log(`[email stub] would send "${kind}"`, data);
}

export async function sendConfirmationEmail(data: BookingEmailData & Record<string, unknown>) {
  logStubEmail("first-time-confirmation", data);
}

export async function sendDuplicateWarningEmail(data: BookingEmailData) {
  logStubEmail("duplicate-warning", data);
}

export async function sendEditConfirmationEmail(data: BookingEmailData & Record<string, unknown>) {
  logStubEmail("edit-confirmation", data);
}

export async function sendCancellationEmail(data: BookingEmailData & Record<string, unknown>) {
  logStubEmail("cancellation-confirmation", data);
}

export async function sendResendLinkEmail(data: BookingEmailData) {
  logStubEmail("resend-magic-link", data);
}

export async function sendHotelCancellationNotice(data: Record<string, unknown>) {
  logStubEmail("hotel-cancellation-notice", data);
}

export async function sendAdminCancellationNotice(data: Record<string, unknown>) {
  logStubEmail("admin-cancellation-notice", data);
}

// Admin-triggered (Stage 3), not sent automatically: a reminder to
// attendees who haven't filled in flight details yet, so carpool groups
// can be finalized closer to the event.
export async function sendFlightDetailsReminderEmail(data: BookingEmailData) {
  logStubEmail("flight-details-reminder", data);
}

// Auto-sent to the planning team (ADMIN_NOTIFICATION_EMAIL, once Stage 4
// wires up real delivery) whenever an attendee fills in the "anything else"
// note on submit or edit - not sent when that field is left blank.
export async function sendPlanningTeamNotesEmail(data: {
  fromName: string;
  notes: string;
  magicLink: string;
}) {
  logStubEmail("planning-team-notes", data);
}
