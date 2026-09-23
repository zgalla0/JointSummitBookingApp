import { randomBytes } from "crypto";

const MAGIC_LINK_TTL_DAYS = 90;

export function generateMagicLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

export function magicLinkExpiry(from: Date = new Date()): Date {
  const expires = new Date(from);
  expires.setUTCDate(expires.getUTCDate() + MAGIC_LINK_TTL_DAYS);
  return expires;
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export function magicLinkUrl(token: string): string {
  return `${baseUrl()}/my-booking/${token}`;
}

/** The main booking-form page - linked from emails so an attendee can look
 *  up the Reference/FAQ info without needing their personal magic link. */
export function appHomeUrl(): string {
  return baseUrl();
}
