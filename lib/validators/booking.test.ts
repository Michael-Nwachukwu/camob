import { describe, expect, it } from "vitest";
import {
  bookingHoldSchema,
  bookingSchema,
  manualBookingSchema,
  paystackInitializeSchema,
  blackoutSchema,
  rateSchema,
  bookingUpdateSchema,
  availabilityQuerySchema
} from "./booking";

describe("bookingHoldSchema", () => {
  it("accepts valid input", () => {
    const result = bookingHoldSchema.safeParse({
      apartmentTypeId: "one-bedroom",
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      guests: 2
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown apartmentTypeId", () => {
    const result = bookingHoldSchema.safeParse({
      apartmentTypeId: "penthouse",
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      guests: 2
    });
    expect(result.success).toBe(false);
  });

  it("coerces guests from a string", () => {
    const result = bookingHoldSchema.safeParse({
      apartmentTypeId: "one-bedroom",
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      guests: "2"
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.guests).toBe(2);
  });

  it("rejects guests over the cap", () => {
    const result = bookingHoldSchema.safeParse({
      apartmentTypeId: "one-bedroom",
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      guests: 99
    });
    expect(result.success).toBe(false);
  });
});

describe("bookingSchema", () => {
  const valid = {
    apartmentTypeId: "one-bedroom" as const,
    checkIn: "2026-06-01",
    checkOut: "2026-06-04",
    paymentMethod: "paystack" as const,
    guest: {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+2348100000000",
      guests: 2
    }
  };

  it("accepts a complete payload", () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects malformed email", () => {
    const result = bookingSchema.safeParse({
      ...valid,
      guest: { ...valid.guest, email: "not-an-email" }
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty fullName", () => {
    const result = bookingSchema.safeParse({
      ...valid,
      guest: { ...valid.guest, fullName: "" }
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown paymentMethod", () => {
    const result = bookingSchema.safeParse({ ...valid, paymentMethod: "crypto" });
    expect(result.success).toBe(false);
  });

  it("passes specialRequests through when provided", () => {
    const result = bookingSchema.safeParse({
      ...valid,
      guest: { ...valid.guest, specialRequests: "Late check-in around 11pm" }
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.guest.specialRequests).toContain("Late");
  });
});

describe("manualBookingSchema", () => {
  it("accepts an admin-created booking", () => {
    const result = manualBookingSchema.safeParse({
      apartmentTypeId: "two-bedroom",
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      paymentMethod: "bank_transfer",
      status: "confirmed",
      paymentStatus: "paid",
      guest: {
        fullName: "Walk-In Guest",
        email: "walkin@example.com",
        phone: "+2348100000000",
        guests: 4
      }
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = manualBookingSchema.safeParse({
      apartmentTypeId: "two-bedroom",
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      paymentMethod: "bank_transfer",
      status: "draft_hold",
      paymentStatus: "paid",
      guest: {
        fullName: "x",
        email: "x@example.com",
        phone: "+2348100000000",
        guests: 1
      }
    });
    expect(result.success).toBe(false);
  });
});

describe("blackoutSchema", () => {
  it("accepts a valid blackout", () => {
    const result = blackoutSchema.safeParse({
      apartmentTypeId: "one-bedroom",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      reason: "owner stay"
    });
    expect(result.success).toBe(true);
  });

  it("rejects too-short reason", () => {
    const result = blackoutSchema.safeParse({
      apartmentTypeId: "one-bedroom",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      reason: "x"
    });
    expect(result.success).toBe(false);
  });
});

describe("rateSchema", () => {
  it("accepts and coerces numeric strings", () => {
    const result = rateSchema.safeParse({
      apartmentTypeId: "one-bedroom",
      nightlyRate: "95000",
      serviceCharge: "0"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nightlyRate).toBe(95000);
      expect(result.data.serviceCharge).toBe(0);
    }
  });

  it("rejects zero or negative nightly rate", () => {
    const result = rateSchema.safeParse({
      apartmentTypeId: "one-bedroom",
      nightlyRate: 0,
      serviceCharge: 0
    });
    expect(result.success).toBe(false);
  });
});

describe("bookingUpdateSchema", () => {
  it("accepts a status-only patch", () => {
    expect(bookingUpdateSchema.safeParse({ status: "confirmed" }).success).toBe(true);
  });

  it("rejects unknown status values", () => {
    expect(bookingUpdateSchema.safeParse({ status: "vip" }).success).toBe(false);
  });
});

describe("paystackInitializeSchema", () => {
  it("requires bookingId + token", () => {
    expect(paystackInitializeSchema.safeParse({}).success).toBe(false);
    expect(paystackInitializeSchema.safeParse({ bookingId: "x", token: "sometoken" }).success).toBe(true);
  });

  it("rejects a missing token", () => {
    expect(paystackInitializeSchema.safeParse({ bookingId: "x", token: "" }).success).toBe(false);
  });
});

describe("availabilityQuerySchema", () => {
  it("treats query params as optional", () => {
    expect(availabilityQuerySchema.safeParse({}).success).toBe(true);
  });

  it("rejects unknown apartmentTypeId", () => {
    expect(availabilityQuerySchema.safeParse({ apartmentTypeId: "studio" }).success).toBe(false);
  });
});
