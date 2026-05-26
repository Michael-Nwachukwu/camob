import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createBookingHoldAsync, createManualBookingAsync } from "@/lib/services/booking";
import { getMonthAvailability, isRangeAvailable } from "@/lib/services/availability";
import { addBlackout } from "@/lib/services/repository";
import { cancelBookingAsync } from "@/lib/services/refunds";
import type { ApartmentTypeId } from "@/lib/types";

// Integration tests over the in-memory store (no DATABASE_URL), proving that
// availability stays in sync across every channel that can occupy a unit:
// admin reservations, public bookings, and admin blackouts — and that a
// cancellation releases the dates. This is the anti-double-booking contract.

const guest = {
  fullName: "Test Guest",
  email: "test@example.com",
  phone: "+2348000000000",
  guests: 2
};

function statusOn(apt: ApartmentTypeId, monthIso: string, date: string) {
  return getMonthAvailability(apt, monthIso).find((day) => day.date === date)?.status;
}

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("booking pipeline stays in sync across channels", () => {
  it("an ADMIN reservation blocks those dates on the PUBLIC side", async () => {
    const checkIn = "2026-07-10";
    const checkOut = "2026-07-13";

    await createManualBookingAsync({
      apartmentTypeId: "two-bedroom",
      checkIn,
      checkOut,
      paymentMethod: "bank_transfer",
      status: "confirmed",
      paymentStatus: "paid",
      guest
    });

    expect(isRangeAvailable("two-bedroom", checkIn, checkOut)).toBe(false);
    expect(statusOn("two-bedroom", "2026-07-01", "2026-07-10")).toBe("booked");
    expect(statusOn("two-bedroom", "2026-07-01", "2026-07-12")).toBe("booked");

    // A public guest can no longer hold the same window.
    await expect(
      createBookingHoldAsync({ apartmentTypeId: "two-bedroom", checkIn, checkOut, guests: 2 })
    ).rejects.toThrow();
  });

  it("a PUBLIC hold blocks a second public hold on the same dates", async () => {
    const checkIn = "2026-07-20";
    const checkOut = "2026-07-22";

    const { hold } = await createBookingHoldAsync({
      apartmentTypeId: "one-bedroom",
      checkIn,
      checkOut,
      guests: 2
    });
    expect(hold.status).toBe("draft_hold");

    await expect(
      createBookingHoldAsync({ apartmentTypeId: "one-bedroom", checkIn, checkOut, guests: 2 })
    ).rejects.toThrow();
  });

  it("an ADMIN blackout makes the dates unbookable publicly", async () => {
    addBlackout({ apartmentTypeId: "two-bedroom", startDate: "2026-07-25", endDate: "2026-07-27", reason: "maintenance" });

    expect(isRangeAvailable("two-bedroom", "2026-07-25", "2026-07-26")).toBe(false);
    expect(statusOn("two-bedroom", "2026-07-01", "2026-07-25")).toBe("blocked");

    await expect(
      createBookingHoldAsync({ apartmentTypeId: "two-bedroom", checkIn: "2026-07-25", checkOut: "2026-07-26", guests: 2 })
    ).rejects.toThrow();
  });

  it("cancelling a reservation frees the dates again", async () => {
    const checkIn = "2026-08-01";
    const checkOut = "2026-08-03";

    const { booking } = await createManualBookingAsync({
      apartmentTypeId: "one-bedroom",
      checkIn,
      checkOut,
      paymentMethod: "bank_transfer",
      status: "confirmed",
      paymentStatus: "paid",
      guest
    });
    expect(isRangeAvailable("one-bedroom", checkIn, checkOut)).toBe(false);

    await cancelBookingAsync(booking.id);

    expect(isRangeAvailable("one-bedroom", checkIn, checkOut)).toBe(true);
    expect(statusOn("one-bedroom", "2026-08-01", "2026-08-01")).toBe("available");
  });

  it("booking one apartment type leaves the other free", async () => {
    const checkIn = "2026-09-05";
    const checkOut = "2026-09-08";

    await createManualBookingAsync({
      apartmentTypeId: "one-bedroom",
      checkIn,
      checkOut,
      paymentMethod: "bank_transfer",
      status: "confirmed",
      paymentStatus: "paid",
      guest
    });

    expect(isRangeAvailable("one-bedroom", checkIn, checkOut)).toBe(false);
    expect(isRangeAvailable("two-bedroom", checkIn, checkOut)).toBe(true);
  });

  it("allows a back-to-back booking starting on the previous stay's checkout day", async () => {
    // First stay: 2026-10-10 → 2026-10-13 (checkout the 13th).
    await createManualBookingAsync({
      apartmentTypeId: "one-bedroom",
      checkIn: "2026-10-10",
      checkOut: "2026-10-13",
      paymentMethod: "bank_transfer",
      status: "confirmed",
      paymentStatus: "paid",
      guest
    });

    // Next guest checks in the morning the first leaves — must be allowed.
    const { hold } = await createBookingHoldAsync({
      apartmentTypeId: "one-bedroom",
      checkIn: "2026-10-13",
      checkOut: "2026-10-15",
      guests: 2
    });
    expect(hold.status).toBe("draft_hold");
  });
});
