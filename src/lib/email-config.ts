// Resend + notification-address settings, read from env. Kept separate from
// config.ts (event dates/rates) since these are delivery settings, not event
// config. See .env.example for the full list.

export const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Needs a domain verified in the Resend account behind RESEND_API_KEY -
// the shared onboarding@resend.dev address only delivers to that account's
// own verified email, not to real attendees.
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Q1 Summit <onboarding@resend.dev>";

// Destination addresses for the two admin-facing notices (see email.ts).
// Left unset in an environment that hasn't configured them yet - those
// sends are skipped (logged, not thrown) rather than failing the booking/
// cancellation flow they're attached to.
export const HOTEL_CONTACT_EMAIL = process.env.HOTEL_CONTACT_EMAIL;
export const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;
