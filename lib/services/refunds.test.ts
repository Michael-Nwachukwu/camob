import { describe, expect, it } from "vitest";
import { computeRefund, canCancel } from "./refunds";
import type { Booking } from "@/lib/types";

// Moderate policy under test:
//   168h+ (7d) → 100%, 48h+ (2d) → 50%, else 0%. Service charge non-refundable.
function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "bk-1",
    unitId: "unit-1a",
    apartmentTypeId: "one-bedroom",
    checkIn: "2026-07-01",
    checkOut: "2026-07-04",
    status: "confirmed",
    guest: { fullName: "Ada", email: "ada@example.com", phone: "+234", guests: 2 },
    subtotal: 285000,
    serviceCharge: 15000,
    total: 300000,
    createdAt: "2026-05-01T00:00:00.000Z",
    paymentMethod: "paystack",
    paymentStatus: "paid",
    ...overrides
  };
}

describe("computeRefund", () => {
  it("gives 100% of the subtotal when 7+ days out", () => {
    const booking = makeBooking({ checkIn: "2026-07-01" });
    // 10 days before check-in.
    const refund = computeRefund(booking, new Date("2026-06-21T12:00:00Z"));
    expect(refund.refundPct).toBe(100);
    expect(refund.refundAmount).toBe(285000); // subtotal only, not the 15k service charge
    expect(refund.nonRefundable).toBe(15000);
  });

  it("gives 50% of the subtotal between 2 and 7 days out", () => {
    const booking = makeBooking({ checkIn: "2026-07-01" });
    // 4 days before check-in.
    const refund = computeRefund(booking, new Date("2026-06-27T12:00:00Z"));
    expect(refund.refundPct).toBe(50);
    expect(refund.refundAmount).toBe(142500); // 285000 * 0.5
  });

  it("gives nothing within 48 hours", () => {
    const booking = makeBooking({ checkIn: "2026-07-01" });
    // 1 day before check-in.
    const refund = computeRefund(booking, new Date("2026-06-30T12:00:00Z"));
    expect(refund.refundPct).toBe(0);
    expect(refund.refundAmount).toBe(0);
    expect(refund.nonRefundable).toBe(300000);
  });

  it("treats a week-plus out as the full bracket", () => {
    const booking = makeBooking({ checkIn: "2026-07-08" });
    const refund = computeRefund(booking, new Date("2026-06-30T00:00:00Z")); // ~8 days
    expect(refund.refundPct).toBe(100);
  });

  it("treats ~3 days out as the half bracket", () => {
    const booking = makeBooking({ checkIn: "2026-07-04" });
    const refund = computeRefund(booking, new Date("2026-07-01T00:00:00Z")); // ~72h
    expect(refund.refundPct).toBe(50);
  });
});

describe("canCancel", () => {
  it("allows cancelling a confirmed future booking", () => {
    const booking = makeBooking({ status: "confirmed", checkIn: "2026-07-01" });
    expect(canCancel(booking, new Date("2026-06-01"))).toBe(true);
  });

  it("allows cancelling a draft hold", () => {
    const booking = makeBooking({ status: "draft_hold", checkIn: "2026-07-01" });
    expect(canCancel(booking, new Date("2026-06-01"))).toBe(true);
  });

  it("refuses once the stay has started", () => {
    const booking = makeBooking({ status: "confirmed", checkIn: "2026-07-01" });
    expect(canCancel(booking, new Date("2026-07-02"))).toBe(false);
  });

  it("refuses already-terminal statuses", () => {
    for (const status of ["cancelled", "expired", "refunded", "refund_pending"] as const) {
      const booking = makeBooking({ status, checkIn: "2026-07-01" });
      expect(canCancel(booking, new Date("2026-06-01"))).toBe(false);
    }
  });
});
