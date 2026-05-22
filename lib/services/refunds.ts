import { differenceInHours, parseISO } from "date-fns";
import { siteCopy } from "@/lib/data/camob";
import { getBookingByIdAsync, updateBookingAsync } from "@/lib/services/repository";
import { refundPaystackPayment } from "@/lib/services/payments";
import type { Booking } from "@/lib/types";

export interface RefundQuote {
  refundPct: number;
  label: string;
  refundAmount: number;
  nonRefundable: number;
  serviceChargeRefundable: boolean;
  hoursUntilCheckIn: number;
}

const CANCELLABLE_STATUSES = new Set(["draft_hold", "pending_payment", "confirmed"]);

/**
 * Pure: how much a guest gets back if they cancel `booking` at `now`.
 * Brackets come from siteCopy so the policy can change without code edits.
 * Refunds apply to the nightly subtotal only; the service charge is
 * non-refundable when `serviceChargeRefundable` is false.
 */
export function computeRefund(booking: Booking, now: Date = new Date()): RefundQuote {
  const { brackets, serviceChargeRefundable } = siteCopy.cancellationPolicy;
  const hoursUntilCheckIn = differenceInHours(parseISO(booking.checkIn), now);

  // Brackets are ordered most-generous first; pick the first one the guest
  // still qualifies for. Falls back to the last (0%) bracket.
  const bracket =
    brackets.find((b) => hoursUntilCheckIn >= b.minHoursBeforeCheckIn) ?? brackets[brackets.length - 1];

  const refundableBase = serviceChargeRefundable ? booking.total : booking.subtotal;
  const refundAmount = Math.round((refundableBase * bracket.refundPct) / 100);
  const nonRefundable = booking.total - refundAmount;

  return {
    refundPct: bracket.refundPct,
    label: bracket.label,
    refundAmount,
    nonRefundable,
    serviceChargeRefundable,
    hoursUntilCheckIn
  };
}

export function canCancel(booking: Booking, now: Date = new Date()): boolean {
  if (!CANCELLABLE_STATUSES.has(booking.status)) return false;
  // Can't cancel a stay that has already started.
  return parseISO(booking.checkIn).getTime() > now.getTime();
}

export interface CancelResult {
  booking: Booking;
  refund: RefundQuote;
  nextStatus: Booking["status"];
  refundOwed: boolean;
}

/**
 * Guest-initiated cancellation. Locks the refund amount at cancel time so a
 * later admin action can't shift the bracket. Paid bookings that are owed a
 * refund go to `refund_pending`; everything else goes straight to `cancelled`.
 */
export async function cancelBookingAsync(bookingId: string, now: Date = new Date()): Promise<CancelResult> {
  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (!canCancel(booking, now)) {
    throw new Error("This booking can no longer be cancelled.");
  }

  const refund = computeRefund(booking, now);
  const wasPaid = booking.paymentStatus === "paid";
  const refundOwed = wasPaid && refund.refundAmount > 0;
  const nextStatus: Booking["status"] = refundOwed ? "refund_pending" : "cancelled";

  const updated = await updateBookingAsync(bookingId, {
    status: nextStatus,
    cancelledAt: now.toISOString(),
    refundAmount: wasPaid ? refund.refundAmount : 0
  });
  if (!updated) {
    throw new Error("Failed to cancel booking");
  }

  return { booking: updated, refund, nextStatus, refundOwed };
}

/** Admin: fire the Paystack refund for a `refund_pending` Paystack booking. */
export async function processPaystackRefundAsync(bookingId: string): Promise<Booking> {
  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (booking.status !== "refund_pending") {
    throw new Error("Booking is not awaiting a refund.");
  }
  if (booking.paymentMethod !== "paystack" || !booking.paymentReference) {
    throw new Error("This booking wasn't paid via Paystack — refund it manually.");
  }

  const amount = booking.refundAmount ?? 0;
  if (amount <= 0) {
    // Nothing to refund — just close it out.
    const closed = await updateBookingAsync(bookingId, { status: "refunded" });
    if (!closed) throw new Error("Failed to update booking");
    return closed;
  }

  await refundPaystackPayment(booking.paymentReference, amount);

  const refunded = await updateBookingAsync(bookingId, { status: "refunded" });
  if (!refunded) {
    throw new Error("Refund issued but booking update failed — check Paystack + retry the status flip.");
  }
  return refunded;
}

/** Admin: mark a manually-refunded (bank transfer) booking as refunded. */
export async function markRefundedAsync(bookingId: string): Promise<Booking> {
  const booking = await updateBookingAsync(bookingId, { status: "refunded" });
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
}
