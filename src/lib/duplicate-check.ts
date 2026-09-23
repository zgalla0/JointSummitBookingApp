import { prisma } from "./prisma";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Exact (non-fuzzy) match on email alone, case-insensitive - everyone is
 * unique by email, so this is the one lookup used everywhere a booking
 * needs to be found or a duplicate needs to be blocked: the Step 0 "have I
 * already submitted?" check, the "resend my link" lookup, and create/edit
 * enforcement that nobody submits twice under the same email. Matches
 * against hotelEmail, detailsEmail, or cuestaEmail - in practice all three
 * hold the same value (the form only collects one email now), but a
 * booking created before that consolidation could still have them differ.
 */
export async function findBookingByEmail(email: string, excludeId?: string) {
  const em = normalize(email);

  // The attendee list for one event is small, so fetch everything and
  // compare case-insensitively in JS rather than relying on the DB's
  // (possibly case-sensitive) text comparison.
  const candidates = await prisma.booking.findMany();

  return (
    candidates.find(
      (b) =>
        b.id !== excludeId &&
        (normalize(b.hotelEmail) === em ||
          normalize(b.detailsEmail) === em ||
          normalize(b.cuestaEmail) === em),
    ) ?? null
  );
}
