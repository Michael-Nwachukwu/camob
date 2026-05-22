import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  it("hashPassword produces a salt:hash pair", () => {
    const out = hashPassword("hunter2");
    const parts = out.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^[0-9a-f]+$/);
    expect(parts[1]).toMatch(/^[0-9a-f]+$/);
  });

  it("two hashes of the same password produce different salts", () => {
    const a = hashPassword("hunter2");
    const b = hashPassword("hunter2");
    expect(a).not.toEqual(b);
  });

  it("verifyPassword accepts the correct password", () => {
    const stored = hashPassword("correct-horse-battery-staple");
    expect(verifyPassword("correct-horse-battery-staple", stored)).toBe(true);
  });

  it("verifyPassword rejects the wrong password", () => {
    const stored = hashPassword("hunter2");
    expect(verifyPassword("hunter3", stored)).toBe(false);
  });

  it("verifyPassword returns false on malformed input rather than throwing", () => {
    expect(verifyPassword("anything", "")).toBe(false);
    expect(verifyPassword("anything", "no-colon-here")).toBe(false);
    expect(verifyPassword("anything", ":empty-salt")).toBe(false);
  });

  it("verifyPassword is length-agnostic safe (different-length hashes don't throw)", () => {
    const stored = hashPassword("right");
    // Truncate the hash to a different length — must return false, not throw.
    const [salt, hash] = stored.split(":");
    const truncated = `${salt}:${hash.slice(0, 10)}`;
    expect(verifyPassword("right", truncated)).toBe(false);
  });
});
