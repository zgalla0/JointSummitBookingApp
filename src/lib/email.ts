import { Resend } from "resend";
import type { Booking, BookingGuest } from "@prisma/client";
import { buildBookingReceiptText } from "./booking-receipt";
import { formatMonthDay } from "./format";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, HOTEL_CONTACT_EMAIL, ADMIN_NOTIFICATION_EMAILS } from "./email-config";

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

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/** Every outbound email goes through here. With no RESEND_API_KEY set (e.g.
 *  local dev without one configured), this falls back to logging exactly
 *  what would have been sent, so the rest of the app behaves the same with
 *  or without real sending wired up. A Resend-side failure is logged, not
 *  thrown - a notification email failing to send should never break the
 *  booking/cancel/edit flow it's attached to. */
async function sendEmail({ to, subject, text }: { to: string | string[]; subject: string; text: string }) {
  if (!resend) {
    console.log(`[email stub - no RESEND_API_KEY set] would send "${subject}" to ${to}`);
    return;
  }

  const { error } = await resend.emails.send({ from: RESEND_FROM_EMAIL, to, subject, text });
  if (error) {
    console.error(`[email] Resend error sending "${subject}" to ${to}:`, error);
  }
}

/** Like sendEmail, but for the two admin-facing notices whose destination
 *  address(es) come from env config that may not be set yet - skips (with a
 *  warning) instead of sending to an empty recipient list. */
async function sendToConfiguredAddress(
  addresses: string | string[] | undefined,
  envVarName: string,
  { subject, text }: { subject: string; text: string },
) {
  const to = Array.isArray(addresses) ? addresses : addresses ? [addresses] : [];
  if (to.length === 0) {
    console.warn(`[email] ${envVarName} is not set - skipping "${subject}"`);
    return;
  }
  await sendEmail({ to, subject, text });
}

export async function sendConfirmationEmail(data: BookingEmailData) {
  await sendEmail({
    to: data.to,
    subject: "You're all set for the Q1 Summit!",
    text: [
      `Hi ${data.firstName},`,
      "",
      "Thanks for filling out the Q1 Joint All Hands Summit attendance & hotel booking form. You're all set!",
      "",
      "Save this link to make any changes later (update your dates, flight info, room, or guests) - no need to fill out the form again:",
      data.magicLink,
      "",
      "Here's what you submitted, for your records:",
      "",
      buildBookingReceiptText(data.booking),
      "",
      "Thanks,",
      "Q1 Summit Planning Team",
    ].join("\n"),
  });
}

export async function sendDuplicateWarningEmail(data: Omit<BookingEmailData, "booking">) {
  await sendEmail({
    to: data.to,
    subject: "You've already submitted a Q1 Summit booking",
    text: [
      `Hi ${data.firstName},`,
      "",
      "Looks like you've already submitted the Q1 Joint All Hands Summit attendance & hotel booking form. Here's your personal link to review or update it - no need to submit again:",
      data.magicLink,
      "",
      "If this wasn't you, or you think this is a mistake, reach out to the planning team directly.",
      "",
      "Thanks,",
      "Q1 Summit Planning Team",
    ].join("\n"),
  });
}

export async function sendEditConfirmationEmail(data: BookingEmailData) {
  await sendEmail({
    to: data.to,
    subject: "Your Q1 Summit booking was updated",
    text: [
      `Hi ${data.firstName},`,
      "",
      "Your Q1 Joint All Hands Summit booking has been updated. Here's what's on file now:",
      "",
      buildBookingReceiptText(data.booking),
      "",
      "Your personal link (save this to make future changes):",
      data.magicLink,
      "",
      "Thanks,",
      "Q1 Summit Planning Team",
    ].join("\n"),
  });
}

export async function sendCancellationEmail(data: BookingEmailData) {
  await sendEmail({
    to: data.to,
    subject: "Your Q1 Summit booking has been cancelled",
    text: [
      `Hi ${data.firstName},`,
      "",
      "This confirms your Q1 Joint All Hands Summit booking has been cancelled.",
      "",
      "For your records, here's what was cancelled:",
      "",
      buildBookingReceiptText(data.booking),
      "",
      "Changed your mind? Just submit the form again anytime to rejoin:",
      data.magicLink,
      "",
      "Thanks,",
      "Q1 Summit Planning Team",
    ].join("\n"),
  });
}

export async function sendResendLinkEmail(data: Omit<BookingEmailData, "booking">) {
  await sendEmail({
    to: data.to,
    subject: "Your Q1 Summit booking link",
    text: [
      `Hi ${data.firstName},`,
      "",
      "Here's your personal link to view or update your Q1 Joint All Hands Summit booking:",
      data.magicLink,
      "",
      "Thanks,",
      "Q1 Summit Planning Team",
    ].join("\n"),
  });
}

type HotelCancellationNotice = {
  reservationFirstName: string;
  reservationLastName: string;
  stayStart: Date;
  stayEnd: Date;
};

export async function sendHotelCancellationNotice(data: HotelCancellationNotice) {
  await sendToConfiguredAddress(HOTEL_CONTACT_EMAIL, "HOTEL_CONTACT_EMAIL", {
    subject: "Q1 Summit - reservation cancellation",
    text: [
      "Please cancel the following reservation for the Q1 Joint All Hands Summit block:",
      "",
      `Name: ${data.reservationFirstName} ${data.reservationLastName}`,
      `Dates: ${formatMonthDay(data.stayStart)} - ${formatMonthDay(data.stayEnd)}`,
      "",
      "Thank you.",
    ].join("\n"),
  });
}

type AdminCancellationNotice = {
  fullName: string;
  stayStart: Date;
  stayEnd: Date;
  daysOut: number;
  byAdmin: boolean;
  hotelNotifiedNote: string;
};

export async function sendAdminCancellationNotice(data: AdminCancellationNotice) {
  await sendToConfiguredAddress(ADMIN_NOTIFICATION_EMAILS, "ADMIN_NOTIFICATION_EMAIL", {
    subject: `Cancellation: ${data.fullName}`,
    text: [
      `${data.fullName} has cancelled their Q1 Summit booking (${data.byAdmin ? "cancelled by an admin" : "self-cancelled"}).`,
      "",
      `Original stay: ${formatMonthDay(data.stayStart)} - ${formatMonthDay(data.stayEnd)}`,
      `Days before check-in: ${data.daysOut}`,
      `Hotel notified automatically: ${data.hotelNotifiedNote}`,
    ].join("\n"),
  });
}

// Admin-triggered, not sent automatically: a reminder to attendees who
// haven't filled in flight details yet, so carpool groups can be finalized
// closer to the event.
export async function sendFlightDetailsReminderEmail(data: Omit<BookingEmailData, "booking">) {
  await sendEmail({
    to: data.to,
    subject: "Add your flight details for the Q1 Summit",
    text: [
      `Hi ${data.firstName},`,
      "",
      "We don't have your flight details yet for the Q1 Joint All Hands Summit. Add them here so we can help coordinate airport pickups and carpools:",
      data.magicLink,
      "",
      "Thanks,",
      "Q1 Summit Planning Team",
    ].join("\n"),
  });
}

// Admin-triggered (bulk, from the Roster check page): a reminder to
// employees on the uploaded roster who don't have a submission yet. Unlike
// sendFlightDetailsReminderEmail, there's no existing booking (and so no
// magic link) to reference - this person hasn't submitted at all. `body`
// is already the per-recipient rendered text (see roster-reminder-email.ts)
// - the admin previews and can edit it before any of these go out.
export async function sendFormReminderEmail(data: { to: string; body: string }) {
  await sendEmail({
    to: data.to,
    subject: "Q1 Joint All Hands Summit - action needed",
    text: data.body,
  });
}

// Auto-sent to the planning team whenever an attendee fills in the
// "anything else" note on submit or edit - not sent when that field is
// left blank.
export async function sendPlanningTeamNotesEmail(data: { fromName: string; notes: string; magicLink: string }) {
  await sendToConfiguredAddress(ADMIN_NOTIFICATION_EMAILS, "ADMIN_NOTIFICATION_EMAIL", {
    subject: `Note from ${data.fromName} - Q1 Summit form`,
    text: [
      `${data.fromName} added a note on their Q1 Summit booking form:`,
      "",
      `"${data.notes}"`,
      "",
      `Their link: ${data.magicLink}`,
    ].join("\n"),
  });
}
