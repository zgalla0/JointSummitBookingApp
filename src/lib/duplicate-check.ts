import { prisma } from "./prisma";

/**
 * Exact (non-fuzzy) match on first name + last name + email, case-insensitive.
 * Email may match either the hotel-booking email or the details email on file.
 * The full attendee list for one event is small, so filtering in JS after a
 * narrowed DB query keeps this portable across SQLite/Postgres without
 * relying on DB-specific case-insensitive collation.
 */
export async function findDuplicateBooking(firstName: string, lastName: string, email: string) {
  const fn = firstName.trim().toLowerCase();
  const ln = lastName.trim().toLowerCase();
  const em = email.trim().toLowerCase();

  // SQLite compares TEXT case-sensitively by default, so narrowing by an
  // exact-case DB filter could miss a same-name-different-case match. The
  // attendee list for one event is small, so fetch everything and compare
  // case-insensitively in JS instead.
  const candidates = await prisma.booking.findMany();

  return (
    candidates.find(
      (b) =>
        b.firstName.trim().toLowerCase() === fn &&
        b.lastName.trim().toLowerCase() === ln &&
        (b.hotelEmail.trim().toLowerCase() === em || b.detailsEmail.trim().toLowerCase() === em),
    ) ?? null
  );
}
