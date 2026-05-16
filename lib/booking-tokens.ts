import crypto from "node:crypto";
import { env } from "@/lib/env";

// Short HMAC over the booking id so guest-facing URLs (booking success,
// bank-transfer instructions, lookup) can't be enumerated. Not a session
// token — just a per-booking proof that the holder created it.
function getSecret(): string {
  return env.bookingLookupSecret ?? env.nextAuthSecret;
}

export function signBookingId(bookingId: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(bookingId)
    .digest("hex")
    .slice(0, 24);
}

export function verifyBookingToken(bookingId: string, token: string | undefined | null): boolean {
  if (!token || token.length !== 24) return false;
  const expected = signBookingId(bookingId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
