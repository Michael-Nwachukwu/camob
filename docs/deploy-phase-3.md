# Phase 3 — admin retheme + production build fix

This phase brings the admin console onto the same design system as the public site, kills the last legacy color aliases, and unblocks production builds.

It is **the first phase that the previous code couldn't actually deploy** — the auth setup pulled `node:crypto` into the Edge-runtime middleware bundle and webpack refused to compile. If your prior `vercel build` was silently failing in CI, this is why.

---

## What changed in code

### Admin reskin
- `app/admin/layout.tsx` — top bar uses `font-serif` italic eyebrow ("— staff only"), serif "Operations" title, brand logo, "Live site ↗" outbound link, sign-out button in `bg-ink`. Signed-in email shown as a serif italic footer line.
- `app/admin/page.tsx` (overview) — stat cards now show a hint line (e.g. "paid + scheduled"), serif italic eyebrows on every section, status pills instead of raw `replaceAll("_", " ")`, "All bookings →" CTA.
- `app/admin/bookings/page.tsx` — full bookings table with payment status, status pills, dropdown that includes refund/admin-block states (not just confirm/cancel). Status-update form is a clean rounded-pill bar.
- `app/admin/calendar/page.tsx` — two-column layout: add-blackout form on the left, current blackouts list on the right with apartment label, dates, reason, and a `CalendarOff` glyph.
- `app/admin/units/page.tsx` — per-apartment cards showing rate, service charge, sleeps, units. Rate override form at the bottom.
- `app/admin/notifications/page.tsx` (new) — table of every notification we attempted, with `delivered` / `skipped (no key)` / `failed` pills derived from the stored payload.
- `components/admin/admin-nav.tsx` (new) — client island that highlights the active route in the nav pill.
- `components/admin/admin-stat-card.tsx` — reskinned to `bg-canvas`, `rounded-lg`, serif numerals.
- `components/admin/status-pill.tsx` (new) — shared booking-status pill (used in overview, bookings, anywhere else that lists bookings).

### Tailwind token cleanup
- Removed `primary`, `primary-container`, `secondary`, `secondary-fixed`, `surface`, `surface-low`, `surface-card-legacy`, `muted`, `outline` from `tailwind.config.ts`. Audited every `*.tsx` first — no remaining usages.

### Build fix
- `auth.config.ts` (new) — minimal `NextAuthConfig` with `secret`, `session.strategy`, `pages`. Imported by `middleware.ts`.
- `middleware.ts` now calls `NextAuth(authConfig)` directly instead of importing the full `auth` from `@/auth`. Edge bundle no longer pulls `node:crypto`.
- `auth.ts` spreads `authConfig` and adds the `Credentials` provider (which transitively uses `lib/password.ts` → `node:crypto`). This file is server-only and never enters Edge.
- Middleware bundle is now 87.9 kB.

### Notification log query
- `lib/services/repository.ts` — `getNotificationLogsAsync(limit)` fetches from Prisma; returns `[]` when no DB is configured.

---

## Owner actions

**None required for this phase.** No new envs, no DB migration, no config changes.

The only things still flagged for you across phases 1–3:

1. Replace placeholder `siteCopy.bankTransfer.accountNumber` in `lib/data/camob.ts` (from phase 2).
2. Replace placeholder `siteCopy.coordinates` in `lib/data/camob.ts` (still placeholder — affects the map pin precision).
3. Confirm `CRON_SECRET` is set in production env (from phase 2).
4. Confirm the Vercel build now succeeds; if you've been deploying off a stale build, redeploy after this lands.

---

## Post-deploy verification

### 1. Build succeeds

```bash
npm run build
```

Expect:
- No `UnhandledSchemeError: Reading from "node:crypto"`.
- Middleware bundle reported (~88 kB).
- All admin routes listed as `ƒ` (dynamic).

### 2. Admin visually matches public site

- Visit `/` (public) and `/admin` (after signing in). They should share the same typography (Iowan Old Style serif italics, Avenir Next sans), same warm cream surfaces, same brand red accents, same `rounded-lg` cards with `shadow-ambient`.
- The nav pill on `/admin` should highlight in `bg-surface-card` when on the active page.
- Status pills (e.g. on `/admin/bookings`) use the same colors as the public booking lookup page.

### 3. Notification log renders

- After at least one booking, visit `/admin/notifications`.
- Each row should show a date, event ("booking created", "payment confirmed"), recipient email, booking ID, and an outcome pill.
- If Resend isn't configured, the pill should read **skipped (no key)** — that's expected.

### 4. No tailwind class drift

Spot-check the public booking flow and the home page — they should look identical to before. The legacy aliases were not in use by any file, but verify visually that nothing has gone untokenized white-on-white.

### 5. Middleware still gates admin APIs

Quick regression check (from phase 1):

```bash
curl -i https://camobresidence.com/api/admin/bookings
# Expect: 401 {"error":"Unauthorized"}
```

---

## Rollback

This phase touches:

- `auth.config.ts` (new), `auth.ts`, `middleware.ts` — auth split
- `tailwind.config.ts` — alias removal
- `app/admin/**/*.tsx` — every admin page
- `app/admin/notifications/page.tsx` (new)
- `components/admin/admin-nav.tsx` (new)
- `components/admin/admin-stat-card.tsx`
- `components/admin/status-pill.tsx` (new)
- `lib/services/repository.ts` — added `getNotificationLogsAsync`

No DB schema change → code rollback is sufficient. If you roll back the auth split but keep middleware on `@/auth`, the build will fail again.

---

## What this phase does NOT fix

Still open beyond milestone C:

- Admin role separation / multiple admin users.
- E2e tests covering admin flows.
- Rate limiting on `/api/auth/*` and `/api/booking-holds`.
- Real Resend templates (currently a minimal HTML stub).
- Refund/cancel flow on the guest side.

---

## Phase 3.b — parity features (follow-up commit)

The three milestone-C items I flagged above as "not fixed" are now done:

### Manual create booking

- New `lib/validators/booking.ts` schema: `manualBookingSchema`.
- New `lib/services/booking.ts` function: `createManualBookingAsync` — runs the same race-safe `createBookingHoldTransactional` to allocate a unit, then updates the booking with the admin-chosen status/payment fields. Payment refs are `CAMOB_MANUAL_${randomUUID()}` so they don't collide with public bookings.
- New page `app/admin/bookings/new/page.tsx` — three-fieldset form (stay / guest / payment). Calls a server action that re-checks `auth()` defensively before mutating.
- `app/admin/bookings/page.tsx` — "+ New booking" CTA next to the status-update form.

### Payments table

- New `lib/services/repository.ts` query: `getPaymentsAsync(limit)` — Prisma `payment.findMany` joined with the parent booking. Returns `[]` if no DB.
- New page `app/admin/payments/page.tsx` — reference, guest, apartment, method, status pill, amount. Shows bank-transfer awaiting-review rows alongside completed Paystack rows.
- `components/admin/admin-nav.tsx` — added the Payments tab.

### Click-to-blackout calendar

- New client island `components/admin/admin-blackout-calendar.tsx` — pulls availability from `/api/availability` for the picked apartment + month, renders a 7-column grid with status colors. Click a start date → it highlights; click a later date → range fills in. Already-blocked days are marked with a `CalendarOff` glyph and can't be re-picked. Booked / past days are disabled. Pre-submit summary shows the selected window in serif italic. Apartment selector + prev/next month arrows.
- `app/admin/calendar/page.tsx` — replaced the raw date-input form with the new client component; the server action still uses `blackoutSchema` for validation and re-checks `auth()`.

### Verification

```bash
npm run build
```

Expect the same shape as before, plus:

- `/admin/bookings/new` listed as `ƒ`.
- `/admin/payments` listed as `ƒ`.
- `/admin/calendar` First Load JS jumps to ~119 kB (the new client island).

### What's still open

- Admin role separation / multiple admin users.
- E2e tests (milestone D).
- Rate limiting + real Resend templates + refund flow (milestone E).
