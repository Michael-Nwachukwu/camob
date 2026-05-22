# Phase 2 — holds, cron, guest lookup, bank transfer

This phase closes the reliability gaps from the audit: the racy hold creation, the in-memory store dual-writes that drift across workers, the lack of hold expiry, and the missing guest booking lookup + bank-transfer instructions screen.

Like phase 1, this is gated by environment configuration. Read every step before deploying.

---

## What changed in code

- `lib/services/holds.ts` — `createBookingHoldTransactional` runs inside a `Serializable` Prisma transaction with automatic retry on `40001`/`P2034`. Two racing browsers can't both claim the same unit/window. `expireStaleHolds` sweeps stale `DRAFT_HOLD` rows.
- `lib/services/booking.ts` — `createBookingHoldAsync` now uses the transactional path when `DATABASE_URL` is set; the memory path is the explicit dev-only fallback.
- `lib/services/repository.ts` — removed silent `try/catch → memory` fallbacks. When a DB is configured, only the DB is touched. Repository read/write errors now bubble up (200/400/500 contracts on the API layer become honest).
- `lib/booking-tokens.ts` — short HMAC over booking id (`signBookingId` / `verifyBookingToken`). Used so guest URLs can't be enumerated.
- `app/api/cron/expire-holds/route.ts` — Vercel-cron endpoint, gated by `CRON_SECRET` in prod, open in dev.
- `vercel.json` — schedules the cron every minute.
- `app/(public)/booking/bank-transfer/page.tsx` — instructions screen with account number, amount, reference, and what-happens-next steps.
- `app/(public)/booking/[id]/page.tsx` — status-aware booking lookup (confirmed / awaiting transfer / paystack pending / cancelled / expired). 404s on bad token without revealing whether the booking exists.
- `app/api/bookings/route.ts` — returns `{ booking, quote, token }`; client redirects use the token.
- `app/(public)/booking/success/page.tsx` — links to the lookup page when a valid token is present.
- `lib/services/payments.ts` — Paystack `callback_url` now carries the token.
- `lib/data/camob.ts` — `siteCopy.bankTransfer` with bank name, account name, account number, and instructions copy.
- `components/booking/booking-flow.tsx` — bank transfers redirect to the instructions screen instead of generic success.

No DB schema migration is required.

---

## Owner actions before deploy

### 1. Generate CRON_SECRET

Stops anyone on the public internet from calling `/api/cron/expire-holds` and flipping holds to expired at will.

```bash
openssl rand -hex 32
```

Set it as `CRON_SECRET` in production env. **Vercel users:** Vercel Cron auto-injects `Authorization: Bearer $CRON_SECRET` when this env var exists — no extra wiring needed.

**Why:** Without this, anyone can repeatedly hit the cron route and force hold expiry. The endpoint is short-circuited in dev (no secret = open) so manual testing stays painless.

### 2. (Optional) Generate BOOKING_LOOKUP_SECRET

If unset, the booking-token HMAC reuses `NEXTAUTH_SECRET`. Setting a separate `BOOKING_LOOKUP_SECRET` means you can rotate guest lookup URLs without invalidating admin sessions.

```bash
openssl rand -hex 32
```

Set it as `BOOKING_LOOKUP_SECRET`. Rotating this **invalidates every existing guest lookup link** — only useful if you suspect a leaked URL was abused.

### 3. Update bank transfer details

Open `lib/data/camob.ts` and replace the placeholder under `siteCopy.bankTransfer`:

```ts
bankTransfer: {
  bankName: "GTBank",                  // your bank
  accountName: "Camob Residence",      // exact name on the account
  accountNumber: "0123456789",         // <— REPLACE
  instructions: "..."                  // copy shown to guests
}
```

These render on `/booking/bank-transfer`. They are **not** secrets — they're shown to anyone who lands on the instructions page with a valid booking token — but they need to be correct or guests will misroute payments.

### 4. Verify Vercel cron is registered

After deploy, in the Vercel dashboard:

- **Project → Settings → Cron Jobs** should list `/api/cron/expire-holds` running `*/1 * * * *`.
- If it doesn't, redeploy after confirming `vercel.json` is at the repo root and committed.

For non-Vercel hosting (Render, Fly, self-hosted) wire the same path into your scheduler of choice — e.g. a 1-minute systemd timer or GitHub Actions `schedule:` workflow that POSTs to `/api/cron/expire-holds` with the `Authorization: Bearer $CRON_SECRET` header.

---

## Production env (full list)

Add to whatever you already configured for phase 1:

```env
# Phase 2 additions
CRON_SECRET="<openssl rand -hex 32>"
BOOKING_LOOKUP_SECRET=""               # optional; leave empty to reuse NEXTAUTH_SECRET
```

The rest of the phase 1 envs (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `PAYSTACK_*`, `RESEND_API_KEY`) still apply.

---

## Post-deploy verification

### 1. Hold creation can't double-book

In two browsers, side by side, pick the same unit and exact same dates, and submit "Continue to dates" within a second of each other. One should succeed; the other should get **"Selected dates are no longer available"**. Before this phase, both could succeed under the right timing.

### 2. Hold expires after 15 minutes

```bash
# Manually trigger the cron (replace YOUR_CRON_SECRET)
curl -i -X POST https://camobresidence.com/api/cron/expire-holds \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# Expect: 200 {"ok":true,"expired":<n>}

# Without the header
curl -i -X POST https://camobresidence.com/api/cron/expire-holds
# Expect: 401 {"error":"Unauthorized"}
```

Wait for the natural cron tick (within a minute) and confirm holds older than 15 minutes flip to `expired` in the admin bookings table.

### 3. Bank-transfer flow

1. Make a booking with `paymentMethod=bank_transfer`.
2. After submit, you should land on `/booking/bank-transfer?bookingId=…&token=…` showing the account details and reference.
3. The booking shows `pending_payment` / `pending_review` in admin. **It must NOT auto-confirm.**
4. Click **View booking status** — you should land on `/booking/<id>?token=…` showing "We're holding your stay".
5. Tamper with the token in the URL (change one character) and reload. Expect 404, not the booking details.

### 4. Paystack callback carries the token

After completing a Paystack test payment, the redirect URL should include both `bookingId` and `token` query params, and `/booking/success` should show a **View booking status** button that opens the protected lookup page.

### 5. Memory store no longer drifts

Tail logs on multiple Next.js workers (Vercel runs many). All `getBookingsAsync` calls should return identical results because they hit the DB, not per-worker memory.

---

## Rollback

If anything in verification fails, roll back the deploy. This phase touches:

- `lib/services/booking.ts`
- `lib/services/repository.ts`
- `lib/services/holds.ts` (new)
- `lib/services/payments.ts`
- `lib/booking-tokens.ts` (new)
- `lib/env.ts` + `.env.example`
- `app/api/bookings/route.ts`
- `app/api/cron/expire-holds/route.ts` (new)
- `app/(public)/booking/[id]/page.tsx` (new)
- `app/(public)/booking/bank-transfer/page.tsx` (new)
- `app/(public)/booking/success/page.tsx`
- `components/booking/booking-flow.tsx`
- `vercel.json` (new)

No DB schema change → code rollback is sufficient, no migration to reverse. Holds already in the DB remain valid; they'll continue to expire via the next cron run after rollback only if you keep the cron job running.

---

## What this phase does NOT fix

Still open, slated for later milestones:

- Admin pages still use the legacy color tokens (in progress, milestone C).
- No way to manually create a booking from the admin (walk-ins / WhatsApp).
- No payments table view or notification log view in admin.
- No click-to-blackout calendar — admin must type ISO dates.
- No e2e tests.
- No rate limiting on `/api/booking-holds`, `/api/bookings`, `/api/auth/*`.
- Real Resend email templates (booking received, hold expiring, payment confirmed).
- Refund / cancel flow on the guest side.
- `siteCopy.coordinates` still a placeholder.
