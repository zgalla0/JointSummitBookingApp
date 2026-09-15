import { prisma } from "./prisma";

/** Looks up a booking by its magic link token, treating an expired token the
 *  same as not found (the link's TTL is meant to be a hard cutoff). */
export async function getBookingByToken(token: string) {
  const booking = await prisma.booking.findUnique({
    where: { magicLinkToken: token },
    include: { guests: true },
  });
  if (!booking) return null;
  if (booking.magicLinkExpiresAt < new Date()) return null;
  return booking;
}
