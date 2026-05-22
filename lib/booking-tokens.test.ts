import { describe, expect, it } from "vitest";
import { signBookingId, verifyBookingToken } from "./booking-tokens";

describe("booking tokens", () => {
  it("signs to a 24-char hex string", () => {
    const token = signBookingId("booking-abc");
    expect(token).toHaveLength(24);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same id + secret", () => {
    const a = signBookingId("booking-xyz");
    const b = signBookingId("booking-xyz");
    expect(a).toEqual(b);
  });

  it("differs for different booking ids", () => {
    expect(signBookingId("id-1")).not.toEqual(signBookingId("id-2"));
  });

  it("verifyBookingToken accepts the matching signature", () => {
    const id = "booking-123";
    expect(verifyBookingToken(id, signBookingId(id))).toBe(true);
  });

  it("rejects tampered tokens", () => {
    const id = "booking-123";
    const token = signBookingId(id);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifyBookingToken(id, tampered)).toBe(false);
  });

  it("rejects tokens of the wrong length without throwing", () => {
    expect(verifyBookingToken("any-id", "short")).toBe(false);
    expect(verifyBookingToken("any-id", "a".repeat(64))).toBe(false);
  });

  it("rejects missing tokens", () => {
    expect(verifyBookingToken("any-id", undefined)).toBe(false);
    expect(verifyBookingToken("any-id", null)).toBe(false);
    expect(verifyBookingToken("any-id", "")).toBe(false);
  });

  it("token for booking A doesn't verify booking B", () => {
    const tokenForA = signBookingId("booking-A");
    expect(verifyBookingToken("booking-B", tokenForA)).toBe(false);
  });
});
