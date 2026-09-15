import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function secret(): string {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("ADMIN_PASSWORD is not set");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Builds a signed "<expiresAtMs>.<hmac>" cookie value. Verifying only needs
 *  the expiry + signature, since there's one shared password rather than
 *  per-user accounts. */
export function createAdminSessionValue(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function isValidAdminSession(value: string | undefined): boolean {
  if (!value) return false;
  const [expiresAtRaw, signature] = value.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(sign(expiresAtRaw), "hex");
    actual = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function checkAdminPassword(candidate: string): boolean {
  const expected = Buffer.from(secret());
  const given = Buffer.from(candidate);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
