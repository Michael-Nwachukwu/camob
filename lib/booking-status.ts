import type { BookingStatus } from "@/lib/types";

// THE single source of truth for "does this booking occupy its unit's dates?"
// Both the availability calendar (lib/services/repository.getActiveBookings*)
// and the hold transaction (lib/services/holds) read from here, so they can
// never drift apart and silently allow a double-booking.
//
// Deliberately EXCLUDES:
//   - cancelled / expired           — released by the guest or the hold timer
//   - refunded / refund_pending     — a cancellation that's been honoured;
//                                     the dates are free even while the money
//                                     is still being returned
export const BLOCKING_STATUSES: BookingStatus[] = [
  "draft_hold",
  "pending_payment",
  "confirmed",
  "admin_blocked"
];

export function isBlocking(status: BookingStatus): boolean {
  return BLOCKING_STATUSES.includes(status);
}

// Prisma enum form (UPPER_SNAKE) for `where: { status: { in: ... } }` queries.
export const BLOCKING_STATUSES_DB = BLOCKING_STATUSES.map(
  (status) => status.toUpperCase()
) as Uppercase<BookingStatus>[];
