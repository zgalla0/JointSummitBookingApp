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

export function magicLinkUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/my-booking/${token}`;
}
