import { describe, expect, it } from "vitest";
import { calculateQuote, findAvailableUnit, getMonthAvailability, isRangeAvailable } from "./availability";

describe("availability service", () => {
  it("calculates quote totals correctly", () => {
    const quote = calculateQuote("one-bedroom", "2026-04-10", "2026-04-13");
    expect(quote.nights).toBe(3);
    expect(quote.subtotal).toBe(225000);
    expect(quote.total).toBe(240000);
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
