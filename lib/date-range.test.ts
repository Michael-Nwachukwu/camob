// Force a UTC+ timezone (Nigeria / WAT) — the zone where mixing parseISO with
// UTC-stored dates broke back-to-back bookings. The helpers must be immune.
process.env.TZ = "Africa/Lagos";

import { describe, it, expect } from "vitest";
import { toUtcDate, rangesOverlap } from "./date-range";

describe("date-range (timezone-safe)", () => {
  it("parses a date-only string to UTC midnight regardless of server TZ", () => {
    expect(toUtcDate("2026-05-28").toISOString()).toBe("2026-05-28T00:00:00.000Z");
  });

  it("treats back-to-back stays as non-overlapping — the turnover day is free", () => {
    // A checks out on the 28th; B checks in on the 28th. Only the boundary is shared.
    expect(rangesOverlap("2026-05-25", "2026-05-28", "2026-05-28", "2026-05-30")).toBe(false);
    expect(rangesOverlap("2026-05-28", "2026-05-30", "2026-05-25", "2026-05-28")).toBe(false);
  });

  it("detects a genuine overlap", () => {
    expect(rangesOverlap("2026-05-25", "2026-05-28", "2026-05-27", "2026-05-29")).toBe(true);
  });

  it("detects a fully-contained range", () => {
    expect(rangesOverlap("2026-05-25", "2026-05-30", "2026-05-26", "2026-05-27")).toBe(true);
  });
});
