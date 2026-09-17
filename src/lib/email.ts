// Email sending is wired up in Stage 4. For now these are stubs so the rest
// of the app can call them at the right trigger points; each just logs what
// it would have sent - but the receipt text below is the real content
// that'll go into the email body once real sending is wired up.

import type { Booking, BookingGuest } from "@prisma/client";
import { buildBookingReceiptText } from "./booking-receipt";

type BookingWithGuests = Booking & { guests?: BookingGuest[] };

type BookingEmailData = {
  to: string;
  firstName: string;
  magicLink: string;
  /** Full booking record (with guests, where available) to render as a
   *  plain-text receipt attendees can keep for their records - not just a
   *  bare confirmation with a link and nothing to show for it. */
  booking: BookingWithGuests;
};

function logStubEmail(kind: string, data: Record<string, unknown>) {
  console.log(`[email stub] would send "${kind}"`, data);
}

export async function sendConfirmationEmail(data: BookingEmailData) {
  logStubEmail("first-time-confirmation", {
    to: data.to,
    firstName: data.firstName,
    magicLink: data.magicLink,
    receipt: buildBookingReceiptText(data.booking),
  });
}

export async function sendDuplicateWarningEmail(data: Omit<BookingEmailData, "booking">) {
  logStubEmail("duplicate-warning", data);
}

export async function sendEditConfirmationEmail(data: BookingEmailData) {
  logStubEmail("edit-confirmation", {
    to: data.to,
    firstName: data.firstName,
    magicLink: data.magicLink,
    receipt: buildBookingReceiptText(data.booking),
  });
}

export async function sendCancellationEmail(data: BookingEmailData) {
  logStubEmail("cancellation-confirmation", {
    to: data.to,
    firstName: data.firstName,
    magicLink: data.magicLink,
    receipt: `For your records, here's what was cancelled:\n\n${buildBookingReceiptText(data.booking)}`,
  });
}

export async function sendResendLinkEmail(data: Omit<BookingEmailData, "booking">) {
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
export async function sendFlightDetailsReminderEmail(data: Omit<BookingEmailData, "booking">) {
  logStubEmail("flight-details-reminder", data);
}

// Admin-triggered (bulk, from the Roster check page): a reminder to
// employees on the uploaded roster who don't have a submission yet. Unlike
// sendFlightDetailsReminderEmail, there's no existing booking (and so no
// magic link) to reference - this person hasn't submitted at all.
export async function sendFormReminderEmail(data: { to: string; firstName: string }) {
  logStubEmail("form-not-submitted-reminder", {
    to: data.to,
    firstName: data.firstName,
    body: [
      `Hi ${data.firstName},`,
      "",
      "Just a friendly reminder, we don't have a response from you yet for the Q1 Joint All Hands Summit Attendance and Hotel Booking form. Whether you're planning to attend or not, we'd appreciate you filling it out so we can plan accordingly.",
      "",
      "If you already submitted this and think you're seeing this by mistake, double check that the email you used on the form matches your Cuesta email in Rippling exactly, we're comparing against that to confirm submissions.",
      "",
      "Just a heads up, if the form isn't filled out, we won't be able to hold a hotel room for you at the summit.",
      "",
      "Thanks so much!",
      "Q1 Summit Planning Team",
    ].join("\n"),
  });
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
