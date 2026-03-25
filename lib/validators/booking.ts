import { z } from "zod";

export const availabilityQuerySchema = z.object({
  apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]).optional(),
  month: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().min(1).max(8).optional()
});

export const bookingHoldSchema = z.object({
  apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().min(1).max(8)
});

export const bookingSchema = z.object({
  holdId: z.string().optional(),
  apartmentTypeId: z.enum(["one-bedroom", "two-bedroom"]),
  checkIn: z.string(),
  checkOut: z.string(),
  paymentMethod: z.enum(["paystack", "bank_transfer"]),
  guest: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    guests: z.coerce.number().min(1).max(8),
    specialRequests: z.string().optional()
  })
});

export const paystackInitializeSchema = z.object({
  bookingId: z.string(),
  email: z.string().email()
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
