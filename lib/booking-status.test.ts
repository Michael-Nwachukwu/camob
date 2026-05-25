import { describe, expect, it } from "vitest";
import { isBlocking, BLOCKING_STATUSES, BLOCKING_STATUSES_DB } from "./booking-status";
import type { BookingStatus } from "@/lib/types";

describe("booking blocking statuses", () => {
  it("counts live reservations as blocking the dates", () => {
    for (const status of ["draft_hold", "pending_payment", "confirmed", "admin_blocked"] as BookingStatus[]) {
      expect(isBlocking(status)).toBe(true);
    }
  });

  it("does NOT block once cancelled, expired, or refunded", () => {
    // refund_pending is the key one: a guest cancellation must free the dates
    // immediately, even while the refund is still being processed.
    for (const status of ["cancelled", "expired", "refunded", "refund_pending"] as BookingStatus[]) {
      expect(isBlocking(status)).toBe(false);
    }
  });

  it("exposes a Prisma-enum form that matches the domain list one-to-one", () => {
    expect(BLOCKING_STATUSES_DB).toEqual(BLOCKING_STATUSES.map((s) => s.toUpperCase()));
  });
});
