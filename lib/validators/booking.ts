import { z } from "zod";

export const availabilityQuerySchema = z.object({
  apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]).optional(),
  month: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().min(1).max(8).optional()
});

// ISO yyyy-MM-dd strings compare lexically, so a plain string compare is a
// valid check-out-after-check-in test. Centralised here so every form +
// API route enforces it the same way; the message lands on the checkOut field.
const checkOutAfterCheckIn = <T extends { checkIn: string; checkOut: string }>(schema: z.ZodType<T>) =>
  schema.refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in.",
    path: ["checkOut"]
  });

export const bookingHoldSchema = checkOutAfterCheckIn(
  z.object({
    apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]),
    checkIn: z.string().min(1, "Pick a check-in date."),
    checkOut: z.string().min(1, "Pick a check-out date."),
    guests: z.coerce.number().min(1).max(8)
  })
);

export const bookingSchema = checkOutAfterCheckIn(
  z.object({
    holdId: z.string().optional(),
    apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]),
    checkIn: z.string().min(1, "Pick a check-in date."),
    checkOut: z.string().min(1, "Pick a check-out date."),
    paymentMethod: z.enum(["paystack", "bank_transfer"]),
    guest: z.object({
      fullName: z.string().min(2, "Enter the guest's full name."),
      email: z.string().email("Enter a valid email."),
      phone: z.string().min(7, "Enter a valid phone number."),
      guests: z.coerce.number().min(1).max(8),
      specialRequests: z.string().optional()
    })
  })
);

export const paystackInitializeSchema = z.object({
  bookingId: z.string(),
  token: z.string().min(1)
});

export const bookingUpdateSchema = z.object({
  status: z
    .enum([
      "draft_hold",
      "pending_payment",
      "confirmed",
      "cancelled",
      "expired",
      "admin_blocked",
      "refund_pending",
      "refunded"
    ])
    .optional(),
  paymentStatus: z.enum(["initialized", "paid", "failed", "pending_review"]).optional()
});

export const blackoutSchema = z.object({
  apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3)
});

export const rateSchema = z.object({
  apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]),
  nightlyRate: z.coerce.number().min(1),
  serviceCharge: z.coerce.number().min(0)
});

export const manualBookingSchema = checkOutAfterCheckIn(
  z.object({
    apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]),
    checkIn: z.string().min(1, "Pick a check-in date."),
    checkOut: z.string().min(1, "Pick a check-out date."),
    paymentMethod: z.enum(["paystack", "bank_transfer"]),
    status: z.enum(["confirmed", "pending_payment", "admin_blocked"]),
    paymentStatus: z.enum(["initialized", "paid", "failed", "pending_review"]),
    notes: z.string().optional(),
    guest: z.object({
      fullName: z.string().min(2, "Enter the guest's full name."),
      email: z.string().email("Enter a valid email."),
      phone: z.string().min(7, "Enter a valid phone number."),
      guests: z.coerce.number().min(1).max(8),
      specialRequests: z.string().optional()
    })
  })
);
