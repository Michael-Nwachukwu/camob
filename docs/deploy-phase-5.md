# Phase 5 — refund / cancellation flow

Guests can now cancel their own booking; the system computes the refund from a policy in site copy and routes paid bookings into an admin refund queue. Admins process Paystack refunds with one click (or mark bank-transfer refunds done manually).

**This phase changes the database schema.** See "Owner actions" — you must apply it before deploying.

---

## Policy (Moderate)

Configured in `lib/data/camob.ts` under `siteCopy.cancellationPolicy`. Refunds apply to the **nightly subtotal only** — the service charge is non-refundable once booked.

| Time before check-in | Refund |
|---|---|
| 7+ days | 100% of subtotal |
| 2–7 days | 50% of subtotal |
| < 48 hours | 0% |

Brackets are data, not code — edit the `brackets` array (or flip `serviceChargeRefundable`) to change the policy without touching logic.

---

## What changed in code

### Schema + types
- `prisma/schema.prisma` — `Booking` gains `cancelledAt DateTime?` and `refundAmount Int?`.
- `lib/types.ts` — matching `cancelledAt?: string` and `refundAmount?: number`.
- `lib/services/repository.ts` — `mapPrismaBooking` reads them; `saveBookingAsync` persists them.

### Refund engine
- `lib/services/refunds.ts` (new):
  - `computeRefund(booking, now)` — **pure**, returns `{ refundPct, label, refundAmount, nonRefundable, hoursUntilCheckIn }`. The refund is locked at this value when the guest cancels, so a later admin action can't shift the bracket.
  - `canCancel(booking, now)` — true only for `draft_hold` / `pending_payment` / `confirmed` with a future check-in.
  - `cancelBookingAsync(id)` — guest cancel. Paid + refund-owed → `refund_pending`; everything else → `cancelled`. Writes `cancelledAt` + `refundAmount`.
  - `processPaystackRefundAsync(id)` — admin: fires the Paystack refund for the stored `paymentReference`, then flips to `refunded`.
  - `markRefundedAsync(id)` — admin: closes out a manually-refunded bank transfer.
- `lib/services/payments.ts` — `refundPaystackPayment(reference, amountNaira)` calls `POST https://api.paystack.co/refund`. Returns a `demo` no-op when `PAYSTACK_SECRET_KEY` is unset.
- `lib/services/notifications.ts` — `sendBookingNotification` now accepts `booking_cancelled` (its own email subject).

### Guest UI
- `app/(public)/booking/[id]/cancel/page.tsx` (new) — token-gated. Shows the policy summary, the exact refund the guest will get, and a confirm button (server action re-verifies the token, calls `cancelBookingAsync`, fires the notification, redirects back to the lookup page with `?cancelled=1`). Renders a "can't cancel" state for terminal/past bookings. Always offers a WhatsApp alternative.
- `app/(public)/booking/[id]/page.tsx` — adds a "Cancel this booking" link (only when `canCancel`), a refund-status row for `refund_pending` / `refunded`, and a success banner after cancelling.

### Admin UI
- `app/admin/bookings/page.tsx` — `refund_pending` rows show the locked refund amount plus an action: "Refund via Paystack" (Paystack bookings → `processPaystackRefundAsync`) or "Mark refunded" (bank transfers → `markRefundedAsync`). All three server actions now call a local `requireAdmin()` guard.

### Tests
- `lib/services/refunds.test.ts` (new) — 9 tests covering each refund bracket, the subtotal-only rule, and every `canCancel` guard. **54 unit tests total now.**
- `tests/e2e/booking-lookup.spec.ts` — two new cases: the cancel page 404s on invalid / missing token.

---

## Owner actions

### 1. Apply the schema change (REQUIRED before deploy)

The project uses Prisma's schema-push workflow (no migrations directory). Against your production database:

```bash
npx prisma db push
```

This adds the two nullable columns. It's non-destructive — existing rows get `NULL` for both, which the code treats as "not cancelled / no refund recorded."

If you later adopt migration history, run `npx prisma migrate dev --name add-cancellation-fields` locally and commit the generated migration instead.

### 2. Confirm Paystack refunds are enabled

Paystack refunds require your live secret key (already set as `PAYSTACK_SECRET_KEY` from phase 1) and that refunds are enabled on your Paystack account (Settings → Preferences). No new env var.

In dev / without a key, `refundPaystackPayment` is a no-op that still flips the booking to `refunded` so the admin flow stays clickable.

### 3. Review the policy copy

Open `lib/data/camob.ts` → `siteCopy.cancellationPolicy`. The `summary` string is shown verbatim to guests on the cancel page. Adjust wording/brackets to match what the owner actually honors.

---

## Verification

### 1. Unit tests

```bash
npm test
```

Expect `Tests  54 passed (54)`.

### 2. Build

```bash
npm run build
```

Expect `/booking/[id]/cancel` listed as `ƒ`, no errors.

### 3. Guest cancel — unpaid hold

1. Create a bank-transfer booking (don't pay). It sits at `pending_payment` / `pending_review`.
2. Open `/booking/<id>?token=…` → click "Cancel this booking".
3. The cancel page should say there's nothing to refund. Confirm.
4. Booking flips to `cancelled`; the dates free up.

### 4. Guest cancel — paid, 7+ days out

1. Make a Paystack test booking with check-in more than a week out; let the webhook confirm it.
2. Cancel it. The page should quote a 100%-of-subtotal refund.
3. Booking flips to `refund_pending`; admin sees the amount + a "Refund via Paystack" button.
4. Click it → Paystack refund fires → booking flips to `refunded`. The guest's lookup page shows the refunded amount.

### 5. Cancellation window enforced

- A booking with check-in inside 48 hours should quote a ₦0 refund and flip straight to `cancelled` (we keep the money, per policy).
- A booking that has already started shows the "can't cancel" state with no confirm button.

### 6. Token gating

```bash
curl -i "https://camobresidence.com/booking/whatever/cancel?token=aaaaaaaaaaaaaaaaaaaaaaaa"
# Expect 404, not the cancel form.
```

---

## Rollback

This phase adds files plus two nullable columns. To roll back:

- Revert the code (refunds service, payments refund fn, the two pages, admin actions, notification union, tests).
- The `cancelledAt` / `refundAmount` columns can stay — they're nullable and unused by the reverted code. Dropping them is optional; if you do, `npx prisma db push` after removing them from the schema.

No data loss either way.

---

## What's left in milestone E

- Real Resend email templates (the current HTML is a stub — cancellation emails reuse the generic body).
- Sentry + structured logging.
- Rate limiting on `/api/auth/*`, `/api/booking-holds`, `/api/bookings`.
- Real `siteCopy.coordinates`.
- DB-backed e2e for the full cancel→refund path (needs a Postgres service in CI; current e2e runs on the in-memory fallback, which doesn't exercise the Paystack refund call).
