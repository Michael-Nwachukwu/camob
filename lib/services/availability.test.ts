import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { calculateQuote, findAvailableUnit, getMonthAvailability, isRangeAvailable } from "./availability";

// The seeded demo bookings are dated April 2026. Pin "today" to early March so
// the availability service still treats those dates as future (and bookable)
// when these tests run, regardless of the real wall clock.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("availability service (one unit per apartment type)", () => {
  it("calculates quote totals correctly", () => {
    const quote = calculateQuote("one-bedroom", "2026-04-10", "2026-04-13");
    expect(quote.nights).toBe(3);
    expect(quote.subtotal).toBe(285000);
    expect(quote.total).toBe(300000);
  });

  it("a single confirmed booking blocks every night it covers", () => {
    // Seed booking-02: two-bedroom, 2026-04-13 → 2026-04-17, confirmed.
    const days = getMonthAvailability("two-bedroom", "2026-04-01");
    const statusOn = (date: string) => days.find((day) => day.date === date)?.status;
    expect(statusOn("2026-04-13")).toBe("booked");
    expect(statusOn("2026-04-16")).toBe("booked");
  });

  it("frees the check-out day and days outside the stay", () => {
    const days = getMonthAvailability("two-bedroom", "2026-04-01");
    const statusOn = (date: string) => days.find((day) => day.date === date)?.status;
    expect(statusOn("2026-04-17")).toBe("available"); // checkout morning is bookable
    expect(statusOn("2026-04-12")).toBe("available"); // night before the stay
  });

  it("finds the only unit for open dates", () => {
    const unit = findAvailableUnit("one-bedroom", "2026-04-10", "2026-04-12");
    expect(unit?.id).toBe("unit-1a");
  });

  it("rejects a window that overlaps a confirmed booking", () => {
    expect(isRangeAvailable("two-bedroom", "2026-04-14", "2026-04-16")).toBe(false);
  });

  it("rejects a blacked-out window", () => {
    expect(isRangeAvailable("two-bedroom", "2026-04-19", "2026-04-20")).toBe(false);
  });
});
