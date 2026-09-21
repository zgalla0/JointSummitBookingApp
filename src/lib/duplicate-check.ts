import { prisma } from "./prisma";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Exact (non-fuzzy) match on first name + last name only, case-insensitive.
 * The attendee list for one event has no two people sharing a name, so name
 * alone reliably answers "have I already submitted?" - the email typed at
 * that point may not be the one on file (e.g. someone types their Cuesta
 * email out of habit but originally booked with a personal one), so it's
 * deliberately not part of the match. Actually updating a booking still
 * requires the emailed magic link, so a name-only lookup here doesn't
 * weaken anything.
 */
export async function findBookingByName(firstName: string, lastName: string, excludeId?: string) {
  const fn = normalize(firstName);
  const ln = normalize(lastName);

  // SQLite compares TEXT case-sensitively by default, so narrowing by an
  // exact-case DB filter could miss a same-name-different-case match. The
  // attendee list for one event is small, so fetch everything and compare
  // case-insensitively in JS instead.
  const candidates = await prisma.booking.findMany();

  return (
    candidates.find(
      (b) => b.id !== excludeId && normalize(b.firstName) === fn && normalize(b.lastName) === ln,
    ) ?? null
  );
}

/**
 * Match on first name + last name + email, case-insensitive. Email may
 * match either the hotel-booking email or the details email on file. Used
 * where a false-positive name-only match would be a real problem (creating
 * or editing a booking), unlike the "did I already submit?" lookup above.
 */
export async function findDuplicateBooking(
  firstName: string,
  lastName: string,
  email: string,
  excludeId?: string,
) {
  const fn = normalize(firstName);
  const ln = normalize(lastName);
  const em = normalize(email);

  const candidates = await prisma.booking.findMany();

  return (
    candidates.find(
      (b) =>
        b.id !== excludeId &&
        normalize(b.firstName) === fn &&
        normalize(b.lastName) === ln &&
        (normalize(b.hotelEmail) === em || normalize(b.detailsEmail) === em),
    ) ?? null
  );
}
