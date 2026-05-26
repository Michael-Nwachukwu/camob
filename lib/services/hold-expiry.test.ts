import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { finalizeBookingAsync } from "@/lib/services/booking";
import { isRangeAvailable } from "@/lib/services/availability";

// Memory-mode (no DATABASE_URL). Fake timers let us fast-forward past the
// payment window to prove abandoned bookings release the dates.
const guest = { fullName: "Test Guest", email: "test@example.com", phone: "+2348000000000", guests: 2 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("hold / payment expiry", () => {
  it("releases the dates when an unpaid Paystack booking's window lapses", async () => {
    const checkIn = "2026-11-10";
    const checkOut = "2026-11-12";

    await finalizeBookingAsync({ apartmentTypeId: "one-bedroom", checkIn, checkOut, paymentMethod: "paystack", guest });
    // Held during the payment window.
    expect(isRangeAvailable("one-bedroom", checkIn, checkOut)).toBe(false);

    // 30 minutes later — past the 15-minute window — and never paid.
    vi.setSystemTime(new Date("2026-06-15T12:30:00Z"));
    expect(isRangeAvailable("one-bedroom", checkIn, checkOut)).toBe(true);
  });

  it("keeps a bank-transfer booking held (it awaits manual review, never auto-expires)", async () => {
    const checkIn = "2026-11-20";
    const checkOut = "2026-11-22";

    await finalizeBookingAsync({ apartmentTypeId: "one-bedroom", checkIn, checkOut, paymentMethod: "bank_transfer", guest });
    expect(isRangeAvailable("one-bedroom", checkIn, checkOut)).toBe(false);

    // Hours later — still held, because there's no auto-expiry window.
    vi.setSystemTime(new Date("2026-06-15T18:00:00Z"));
    expect(isRangeAvailable("one-bedroom", checkIn, checkOut)).toBe(false);
  });
});
