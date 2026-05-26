# Camob Residence — agent notes

A short-let booking site for a two-maisonette property in Ogombo, Lekki, Lagos. Public marketing + booking funnel on the front, single-admin operations console on the back.

## Stack

- **Next.js 15** App Router, React 19, TypeScript strict.
- **Prisma 6** + PostgreSQL. In-memory fallback when `DATABASE_URL` is absent (dev-only).
- **next-auth v5 beta** (Credentials provider, single hard-coded admin).
- **Tailwind v3** with a custom token set (see Design system).
- **Paystack** for payments, **Resend** for transactional email (both optional in dev).
- **Vitest** for unit tests (45 across 5 files). **Playwright** for e2e (22 tests, 11 specs × 2 projects). GitHub Actions CI in `.github/workflows/ci.yml`.
- **Framer Motion v12** via the `motion/react` import (not `framer-motion`).

## Layout cheat sheet

```text
app/
  (public)/         marketing + booking funnel
    booking/[id]/   Guest booking lookup (token-gated)
    booking/bank-transfer/  Transfer instructions screen
    booking/success/        Post-Paystack landing
  admin/            staff console (guarded by middleware)
  api/              JSON endpoints — admin ones live under /api/admin/*
    cron/           /api/cron/expire-holds (CRON_SECRET gated)
auth.config.ts      Edge-safe NextAuth config (imported by middleware, NO node deps)
auth.ts             Full NextAuth config + handlers/signIn/signOut/auth exports
middleware.ts       Guards /admin/* (pages) and /api/admin/* (JSON 401)
instrumentation.ts  Server-startup hook — refuses to start with default secrets in prod
vercel.json         Cron schedule (every minute, expire-holds) — Vercel path
Dockerfile          Multi-stage standalone build (deps → builder → runner)
docker-compose.yml  Self-host stack: app + Postgres + Caddy + cron + migrate/seed tools
Caddyfile           Reverse proxy + automatic HTTPS (reads {$DOMAIN})
lib/
  data/camob.ts     Site copy, apartment/unit catalog, attractions, FAQ, bank details
  services/
    availability    Quote calc, availability lookups
    booking         Hold + finalize flow (transactional when DB present)
    holds           createBookingHoldTransactional, expireStaleHolds
    refunds         computeRefund (pure), cancelBookingAsync, processPaystackRefundAsync
    payments        Paystack init + refund + webhook signature verify
    notifications   Resend send + NotificationLog write
    repository      Prisma queries with in-memory dev fallback
  validators/       Zod schemas for API payloads
  password.ts       Scrypt hash + timing-safe verify
  auth-helpers.ts   requireAdmin() handler guard
  booking-tokens.ts HMAC-signed guest lookup tokens (signBookingId / verifyBookingToken)
  env.ts            Centralised env access (NEVER read process.env in app code)
  prisma.ts         Singleton Prisma client
  types.ts          Domain types (Booking, Quote, Guest, …)
components/
  booking/          BookingFlow + AvailabilityCalendar (the 3-step mobile wizard)
  sections/         Home/apartment marketing sections
  admin/            AdminNav, AdminStatCard, StatusPill, AdminBlackoutCalendar
  layout/           SiteHeader, SiteFooter, WhatsappFab
  ui/               Reveal, TiltHover, GoogleMapEmbed
prisma/
  schema.prisma     The schema. Seed: `npm run db:seed` (`SEED_DEMO_DATA=true` for demo bookings)
tests/e2e/          Playwright specs (admin auth, booking lookup, public smoke)
playwright.config.ts  Runs `next dev` on :3100 with in-memory fallback
.github/workflows/ci.yml  typecheck-and-unit → build → e2e
```

## Design system (hospitality, NOT SaaS)

- **Vibe**: warm cream chrome, single saturated brand red, serif italics for emphasis, polaroid frames, slow ambient motion. The home page sets the tone — match it.
- **Fonts**: `font-serif` is Iowan Old Style → Palatino → Georgia. `font-sans` is Avenir Next → Segoe UI → Helvetica Neue. Don't introduce Inter or other system fonts.
- **Tokens** (use these everywhere): `bg-canvas`, `bg-surface-soft`, `bg-surface-card`, `bg-surface-deep`, `text-ink`, `text-body`, `text-mute`, `text-ash`, `border-hairline`, `bg-brand` / `bg-brand-pressed`, `bg-success-pale`/`text-success`, `text-danger`, `focus-ring`.
- **Legacy aliases removed** (`primary`, `secondary`, `surface`, `surface-low`, `muted`, `outline`, `primary-container`, `secondary-fixed`, `surface-card-legacy`). Don't reintroduce them — admin is now on the same token system as the public site.
- **Radii**: `rounded-sm` (8px), `rounded-md` (16px), `rounded-lg` (32px), `rounded-full`. Don't sprinkle arbitrary radii.
- **Shadows**: `shadow-ambient` (cards), `shadow-scrim` (modals / important surfaces).
- **Motion**: use `motion/react`, prefer `Reveal` + `TiltHover` wrappers in `components/ui/reveal.tsx` over open-coded animations. The hero marquee is a pure CSS `.marquee-track` in `app/globals.css`.

## Backend conventions

- **Centralise env reads in `lib/env.ts`.** App code imports `env`, never `process.env`.
- **Services own domain logic**, route handlers stay thin — validate with zod, call a service, format response.
- **Async-only going forward.** The sync + async dual API in `repository.ts`/`booking.ts` is legacy; new code uses the `*Async` variants. The in-memory store is the dev-only fallback when `DATABASE_URL` is missing.
- **No DB-fallback-to-memory.** When `hasDatabase()` is true, the DB is authoritative — repository functions throw on DB errors rather than silently falling back to the memory store. That used to mask real failures and let workers drift.
- **Hold creation is transactional.** `createBookingHoldAsync` calls `createBookingHoldTransactional` (in `lib/services/holds.ts`) which uses Prisma `$transaction` with `Serializable` isolation + retry on `40001`/`P2034`. Don't add availability checks outside the transaction.
- **Stale holds**: a Vercel cron hits `/api/cron/expire-holds` every minute and flips `DRAFT_HOLD` rows past `expiresAt` to `EXPIRED`. The route is gated by `CRON_SECRET` in prod.
- **Guest URLs are token-gated.** Lookup pages (`/booking/[id]`, `/booking/bank-transfer`) require a 24-char HMAC of the booking id (`signBookingId` in `lib/booking-tokens.ts`). Verification is constant-time. Tokens are returned by `/api/bookings` and embedded in the Paystack callback URL.
- **Never trust client-side totals.** Recompute price server-side from `RatePlan` + dates.
- **Idempotency**: payment refs are persisted on first call (`crypto.randomUUID`), not regenerated. Webhook handler is idempotent on `(bookingId, reference, status=paid)`.
- **Dates are UTC date-only.** `Booking.checkIn/checkOut` + blackout dates are `@db.Date`. Never parse date-only strings with `parseISO` (local TZ) — use `toUtcDate` from `lib/date-range.ts`. Stays are half-open `[checkIn, checkOut)`, so a check-in on a prior stay's checkout day is NOT an overlap (back-to-back is allowed).
- **DB backstop against double-booking**: a Postgres `EXCLUDE` constraint (`booking_no_overlap`, in `prisma/sql/0001_booking_no_overlap.sql`) rejects overlapping blocking bookings per unit. It's raw SQL (Prisma can't express it) and is NOT applied by `prisma db push` — apply it separately (see [docs/deploy-phase-6.md](docs/deploy-phase-6.md)). The hold path catches its violation (`23P01`) and returns a friendly "dates no longer available".
- **What occupies a unit** is the single `BLOCKING_STATUSES` list in `lib/booking-status.ts`, shared by the calendar and the hold transaction. Abandoned holds/Paystack bookings carry an `expiresAt` and are swept to `EXPIRED`; bank-transfer bookings carry no `expiresAt` (manual review, never auto-expire).

## Auth & security (non-negotiable)

- `/api/admin/*` is gated by `middleware.ts`. If you add a new admin route, it's covered automatically as long as it lives under that prefix.
- Admin password is stored as a scrypt hash in `ADMIN_PASSWORD_HASH`. Plaintext `ADMIN_PASSWORD` is dev-only and ignored in production. Generate a hash with `npm run hash:password <pw>`.
- `instrumentation.ts` throws at server start if `NEXTAUTH_SECRET`/`ADMIN_PASSWORD_HASH` are missing in production. Don't bypass this.
- Paystack webhook verifies signature **and** amount before confirming. Don't accept arbitrary `payload.data.amount`.
- Bank transfer bookings are `pending_payment` + `paymentStatus: pending_review` until admin marks them paid. They never auto-confirm.

## Roadmap status

- **Milestone A — security hardening: ✅ done.** Admin APIs gated (middleware + handler-level `requireAdmin`), scrypt-hashed password, `instrumentation.ts` refuses to boot with default secrets in prod, Paystack webhook verifies signature + reference + amount + idempotency, payment refs are `crypto.randomUUID()` and minted once, bank-transfer no longer auto-confirms. Pre-deploy checklist in [docs/deploy-phase-1.md](docs/deploy-phase-1.md).
- **Milestone B — holds actually work: ✅ done.** Transactional hold creation (`lib/services/holds.ts`), no more in-memory dual-writes, `/api/cron/expire-holds` + `vercel.json` schedule, guest booking lookup at `/booking/[id]` with HMAC token, bank-transfer instructions screen at `/booking/bank-transfer`. Pre-deploy checklist in [docs/deploy-phase-2.md](docs/deploy-phase-2.md). Owner still needs to replace placeholder `siteCopy.bankTransfer.accountNumber` in `lib/data/camob.ts` before launch.
- **Milestone C — admin parity: ✅ done.** Admin reskinned onto public tokens + serif headlines. Active-state nav (`AdminNav`). Legacy color aliases dropped from `tailwind.config.ts`. Auth split into `auth.config.ts` (Edge-safe) + `auth.ts` (full) — fixes a latent Edge-runtime build error. Parity pages: `/admin/bookings/new` (manual create), `/admin/payments` (Payment rows joined with bookings), `/admin/notifications` (NotificationLog rows), and a click-to-blackout calendar on `/admin/calendar` via `AdminBlackoutCalendar`. Pre-deploy notes in [docs/deploy-phase-3.md](docs/deploy-phase-3.md).
- **Milestone D — testable: ✅ done.** 45 Vitest unit tests covering password hashing, booking tokens, Paystack webhook verifier, every zod validator, and the availability service (with `vi.setSystemTime` so the seeded April-2026 dates stay valid). 22 Playwright e2e tests across chromium + Pixel 5 mobile viewports covering admin auth gating, booking-token enumeration defense, and the public booking smoke path. GitHub Actions CI runs typecheck + unit + build + e2e on every PR. Notes in [docs/deploy-phase-4.md](docs/deploy-phase-4.md).
- **Milestone E — production polish: in progress.** ✅ Refund/cancel flow done: guest self-cancel at `/booking/[id]/cancel` (token-gated), Moderate policy in `siteCopy.cancellationPolicy` (7d→100% / 2-7d→50% / <48h→0%, subtotal only), refund locked at cancel time in `Booking.refundAmount`, admin one-click Paystack refund + manual mark-refunded on `/admin/bookings`. Schema gained `cancelledAt` + `refundAmount` (run `npx prisma db push`). Notes in [docs/deploy-phase-5.md](docs/deploy-phase-5.md). ⏳ Still pending: real Resend templates, Sentry, rate limiting, real `siteCopy.coordinates`.

## Local dev quickstart

```bash
cp .env.example .env.local        # fill in DATABASE_URL + secrets
npm install
npm run db:migrate:dev            # if using a real DB
npm run db:seed                   # apartments/units/rates
npm run dev
```

Set `ADMIN_PASSWORD_HASH` via `npm run hash:password <your-password>` — copy the output into `.env.local`. The plaintext `ADMIN_PASSWORD` will be ignored in production.

In production also set `CRON_SECRET` (for Vercel Cron auth) and optionally `BOOKING_LOOKUP_SECRET` (defaults to `NEXTAUTH_SECRET`).

## Deployment

Two supported paths:

- **Vercel**: `vercel.json` cron + a managed Postgres (Neon). Note Hobby tier is non-commercial and its cron only runs daily (the on-read hold sweep covers the gap).
- **Self-host (Hetzner VPS)**: `Dockerfile` + `docker-compose.yml` (app + Postgres + Caddy auto-HTTPS + a 1-minute cron sidecar). Full walkthrough incl. backups in [docs/deploy-vps.md](docs/deploy-vps.md). Schema sync via `docker compose run --rm migrate`. Secrets in `.env.production` (gitignored; template in `.env.production.example`).

## House rules

- No SaaS-tone copy. Read existing strings in `lib/data/camob.ts` for voice; warm, slightly understated, lowercase eyebrows like `— where you'll be`.
- Default to editing existing files. Don't create planning/decision docs unless asked.
- Don't introduce dependencies casually — node `crypto` covers hashing/HMAC; date-fns is already there.
- Mobile is a first-class target; the booking flow has a 3-step wizard. Keep the desktop two-column layout intact when touching that file.
