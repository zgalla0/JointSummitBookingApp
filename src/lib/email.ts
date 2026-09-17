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
