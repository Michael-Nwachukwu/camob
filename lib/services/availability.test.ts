import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { calculateQuote, findAvailableUnit, getMonthAvailability, isRangeAvailable } from "./availability";

// The seeded demo bookings in `lib/data/camob.ts` are dated April 2026.
// Pin "today" to early March 2026 so the availability service still treats
// those dates as future (and therefore bookable / blockable) when these
// tests run. Without this, every booked day rolls into "past" and the
// assertions below would silently flip pass→fail as wall-clock time moved on.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("availability service", () => {
  it("calculates quote totals correctly", () => {
    const quote = calculateQuote("one-bedroom", "2026-04-10", "2026-04-13");
    expect(quote.nights).toBe(3);
    expect(quote.subtotal).toBe(285000);
    expect(quote.total).toBe(300000);
  });

  it("marks sold-out periods when both two-bedroom units are occupied", () => {
    const days = getMonthAvailability("two-bedroom", "2026-04-01");
    const target = days.find((day) => day.date === "2026-04-14");
    expect(target?.status).toBe("booked");
  });

  it("finds an available unit for open dates", () => {
    const unit = findAvailableUnit("one-bedroom", "2026-04-10", "2026-04-12");
    expect(unit?.id).toBe("unit-1a");
  });

  it("rejects blocked windows", () => {
    expect(isRangeAvailable("two-bedroom", "2026-04-19", "2026-04-20")).toBe(false);
  });
});
