# Camob Residence — agent notes

A short-let booking site for a two-maisonette property in Ogombo, Lekki, Lagos. Public marketing + booking funnel on the front, single-admin operations console on the back.

## Stack

- **Next.js 15** App Router, React 19, TypeScript strict.
- **Prisma 6** + PostgreSQL. In-memory fallback when `DATABASE_URL` is absent (dev-only).
- **next-auth v5 beta** (Credentials provider, single hard-coded admin).
- **Tailwind v3** with a custom token set (see Design system).
- **Paystack** for payments, **Resend** for transactional email (both optional in dev).
- **Vitest** for unit tests; no e2e yet.
- **Framer Motion v12** via the `motion/react` import (not `framer-motion`).

## Layout cheat sheet

```text
app/
  (public)/         marketing + booking funnel
  admin/            staff console (guarded by middleware)
  api/              JSON endpoints — admin ones live under /api/admin/*
auth.ts             NextAuth config + handlers/signIn/signOut/auth exports
middleware.ts       Guards /admin/* (pages) and /api/admin/* (JSON 401)
instrumentation.ts  Server-startup hook — refuses to start with default secrets in prod
lib/
  data/camob.ts     Site copy, apartment/unit catalog, attractions, FAQ
  services/         Domain logic (booking, availability, payments, notifications, repository)
  validators/       Zod schemas for API payloads
  auth-helpers.ts   Password hashing (scrypt) + verifyPassword
  env.ts            Centralised env access (NEVER read process.env in app code)
  prisma.ts         Singleton Prisma client
  types.ts          Domain types (Booking, Quote, Guest, …)
components/
  booking/          BookingFlow + AvailabilityCalendar (the 3-step mobile wizard)
  sections/         Home/apartment marketing sections
  admin/            Admin UI primitives (still on legacy tokens — see TODO)
  layout/           SiteHeader, SiteFooter, WhatsappFab
  ui/               Reveal, TiltHover, GoogleMapEmbed
prisma/
  schema.prisma     The schema. Seed: `npm run db:seed` (`SEED_DEMO_DATA=true` for demo bookings)
```

## Design system (hospitality, NOT SaaS)

- **Vibe**: warm cream chrome, single saturated brand red, serif italics for emphasis, polaroid frames, slow ambient motion. The home page sets the tone — match it.
- **Fonts**: `font-serif` is Iowan Old Style → Palatino → Georgia. `font-sans` is Avenir Next → Segoe UI → Helvetica Neue. Don't introduce Inter or other system fonts.
- **Current tokens** (use these everywhere going forward): `bg-canvas`, `bg-surface-soft`, `bg-surface-card`, `bg-surface-deep`, `text-ink`, `text-body`, `text-mute`, `text-ash`, `border-hairline`, `bg-brand` / `bg-brand-pressed`, `bg-success-pale`/`text-success`, `text-danger`, `focus-ring`.
- **Legacy aliases** (`primary`, `secondary`, `surface`, `surface-low`, `muted`, `outline`) exist only to keep admin pages compiling. Remove them once admin retheme lands; don't add new usages.
- **Radii**: `rounded-sm` (8px), `rounded-md` (16px), `rounded-lg` (32px), `rounded-full`. Don't sprinkle arbitrary radii.
- **Shadows**: `shadow-ambient` (cards), `shadow-scrim` (modals / important surfaces).
- **Motion**: use `motion/react`, prefer `Reveal` + `TiltHover` wrappers in `components/ui/reveal.tsx` over open-coded animations. The hero marquee is a pure CSS `.marquee-track` in `app/globals.css`.

## Backend conventions

- **Centralise env reads in `lib/env.ts`.** App code imports `env`, never `process.env`.
- **Services own domain logic**, route handlers stay thin — validate with zod, call a service, format response.
- **Async-only going forward.** The sync + async dual API in `repository.ts`/`booking.ts` is legacy; new code uses the `*Async` variants. The in-memory store is the dev-only fallback when `DATABASE_URL` is missing.
- **Never trust client-side totals.** Recompute price server-side from `RatePlan` + dates.
- **Idempotency**: payment refs are persisted on first call (`crypto.randomUUID`), not regenerated. Webhook handler is idempotent on `(bookingId, reference, status=paid)`.

## Auth & security (non-negotiable)

- `/api/admin/*` is gated by `middleware.ts`. If you add a new admin route, it's covered automatically as long as it lives under that prefix.
- Admin password is stored as a scrypt hash in `ADMIN_PASSWORD_HASH`. Plaintext `ADMIN_PASSWORD` is dev-only and ignored in production. Generate a hash with `npm run hash:password <pw>`.
- `instrumentation.ts` throws at server start if `NEXTAUTH_SECRET`/`ADMIN_PASSWORD_HASH` are missing in production. Don't bypass this.
- Paystack webhook verifies signature **and** amount before confirming. Don't accept arbitrary `payload.data.amount`.
- Bank transfer bookings are `pending_payment` + `paymentStatus: pending_review` until admin marks them paid. They never auto-confirm.

## Roadmap status

- **Milestone A — security hardening: ✅ done.** Admin APIs gated (middleware + handler-level `requireAdmin`), scrypt-hashed password, `instrumentation.ts` refuses to boot with default secrets in prod, Paystack webhook verifies signature + reference + amount + idempotency, payment refs are `crypto.randomUUID()` and minted once, bank-transfer no longer auto-confirms. Pre-deploy checklist in [docs/deploy-phase-1.md](docs/deploy-phase-1.md).
- **Milestone B — holds actually work: pending.** Transactional hold creation, kill in-memory dual-writes, hold-expiry cron, guest booking lookup, bank-transfer instructions screen.
- **Milestone C — admin parity: pending.** Reskin admin to new tokens, drop legacy aliases, manual booking creation, payments + notification log views, click-to-blackout calendar.
- **Milestone D — testable: pending.** Playwright e2e + API route tests + webhook/validator unit tests; wire into CI.
- **Milestone E — production polish: pending.** Real Resend templates, Sentry, rate limiting, refund/cancel guest flow, real `siteCopy.coordinates`.

## Local dev quickstart

```bash
cp .env.example .env.local        # fill in DATABASE_URL + secrets
npm install
npm run db:migrate:dev            # if using a real DB
npm run db:seed                   # apartments/units/rates
npm run dev
```

Set `ADMIN_PASSWORD_HASH` via `npm run hash:password <your-password>` — copy the output into `.env.local`. The plaintext `ADMIN_PASSWORD` will be ignored in production.

## House rules

- No SaaS-tone copy. Read existing strings in `lib/data/camob.ts` for voice; warm, slightly understated, lowercase eyebrows like `— where you'll be`.
- Default to editing existing files. Don't create planning/decision docs unless asked.
- Don't introduce dependencies casually — node `crypto` covers hashing/HMAC; date-fns is already there.
- Mobile is a first-class target; the booking flow has a 3-step wizard. Keep the desktop two-column layout intact when touching that file.
