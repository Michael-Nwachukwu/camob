# Phase 4 — tests + CI

This phase wires up automated testing so future changes can't silently regress the security and booking flow work from phases 1–3.

There are no runtime changes, no DB migrations, no new env vars. The only owner action is enabling the GitHub Actions workflow (it runs automatically once committed and CI is enabled on the repo).

---

## What landed

### Unit tests (Vitest)

- `lib/services/availability.test.ts` — pre-existing, fixed by mocking `vi.setSystemTime("2026-03-01")` so the April-2026 seed data stays relevant as wall-clock time moves on. Four assertions on quote math, booked windows, free-unit lookup, blackout rejection.
- `lib/password.test.ts` — `hashPassword` produces a `salt:hash` pair with unique salts; `verifyPassword` accepts the right password, rejects the wrong one, doesn't throw on malformed or short hashes.
- `lib/booking-tokens.test.ts` — deterministic 24-char hex tokens, rejects tampered tokens, length-agnostic safe (different lengths return false rather than throwing), and a token signed for booking A doesn't verify booking B.
- `lib/services/payments.test.ts` — Paystack webhook verifier accepts only HMAC-signed bodies, falls back from `PAYSTACK_WEBHOOK_SECRET` to `PAYSTACK_SECRET_KEY`, rejects tampered bodies, and refuses to verify when no secret is configured. Uses `vi.resetModules()` to re-import the module per test so env changes take effect.
- `lib/validators/booking.test.ts` — every zod schema in `lib/validators/booking.ts`: `bookingHoldSchema`, `bookingSchema`, `manualBookingSchema`, `blackoutSchema`, `rateSchema`, `bookingUpdateSchema`, `paystackInitializeSchema`, `availabilityQuerySchema`. Covers happy paths plus the regressions that matter (unknown enum values, malformed email, coercion from strings).

Total: **45 unit tests across 5 files.** Vitest ignores `tests/e2e/**` so Playwright specs don't get picked up.

### End-to-end tests (Playwright)

- `tests/e2e/admin-auth.spec.ts` — `GET /api/admin/bookings`, `PATCH /api/admin/bookings/[id]`, `POST /api/admin/blackouts` all return 401 unauthenticated; `/admin` redirects unauth users to `/admin/sign-in`; the dev cron endpoint runs without a secret.
- `tests/e2e/booking-lookup.spec.ts` — `/booking/<id>` 404s when the token is missing, invalid, or wrong length. `/booking/bank-transfer` 404s without a token. These are the regression tests for the HMAC-token enumeration defense.
- `tests/e2e/public-booking.spec.ts` — home page renders the H1, `/book` shows both maisonette buttons in the unit picker, the hold endpoint returns a `draft_hold` with an expiry. The hold test staggers dates per project (`testInfo.project.name === "mobile" ? 90 : 60`) so chromium and mobile don't collide on the shared in-memory store.

Both projects run: **chromium** (desktop Chrome) and **mobile** (Pixel 5 viewport — still chromium-based, no WebKit install needed).

Total: **11 specs × 2 projects = 22 e2e tests.** Local run takes ~25 s.

### Playwright config

- `playwright.config.ts` — runs `next dev` on port 3100 via the `webServer` block. Dev mode means:
  - `NODE_ENV !== "production"` so the plaintext `ADMIN_PASSWORD` fallback works
  - `instrumentation.ts` doesn't refuse to boot (it only asserts in production)
  - No `DATABASE_URL` needed — the in-memory repository fallback handles all reads/writes
- `fullyParallel: false`, `workers: 1` — the in-memory store is shared across the suite; sequential keeps it predictable.
- `retries: 2` in CI, `0` locally. `trace: "on-first-retry"` for cheap debugging.

### CI workflow

`.github/workflows/ci.yml` runs three jobs on push to main + every PR:

1. **typecheck-and-unit** — `npm ci`, `npm run db:generate` (Prisma client codegen), `npm run typecheck`, `npm test`. ~2 minute wall clock.
2. **build** — full `next build` against placeholder envs. Catches Edge-runtime bundling regressions like the `node:crypto` one we hit in phase 3.
3. **e2e** — installs chromium via `actions/cache` (cached between runs by `package-lock.json` hash), runs `npm run test:e2e`, uploads the HTML report on failure.

Jobs `build` and `e2e` both depend on `typecheck-and-unit`. The e2e step has a 15-minute timeout.

### Package scripts

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

### Gitignore

`playwright-report/`, `test-results/`, `playwright/.cache/` added.

---

## Owner actions

**Once, before the first PR:** the CI workflow runs automatically once `.github/workflows/ci.yml` lands on a branch. Make sure Actions is enabled for the repo (it is by default; only relevant if you disabled it).

**To run e2e locally:**

```bash
npx playwright install chromium      # one-time, ~90 MB download
npm run test:e2e                     # all projects
npm run test:e2e -- --project=chromium  # desktop only
npm run test:e2e:ui                  # interactive runner
```

---

## Verification

### 1. Unit tests pass

```bash
npm test
```

Expect: `Tests  45 passed (45)`.

### 2. Build succeeds

```bash
npm run build
```

Expect: middleware bundle ~88 kB, no `node:crypto` errors.

### 3. E2E pass locally

```bash
npx playwright install chromium
npm run test:e2e
```

Expect: `22 passed`. First run downloads the chromium binary (~90 MB); subsequent runs reuse the cached browser.

### 4. CI passes on push

Push a branch and open a PR. The Actions tab should show three green checks: typecheck-and-unit, build, e2e.

---

## What this phase does NOT fix

Still on the docket for milestone E:

- Real Resend email templates (booking received, hold expiring, payment confirmed).
- Sentry + structured logging.
- Rate limiting on `/api/auth/*`, `/api/booking-holds`, `/api/bookings`.
- Refund/cancel flow on the guest side.
- Real `siteCopy.coordinates`.
- API route handler tests (integration-level — could add later with `next-test-api-route-handler` if e2e coverage proves insufficient).
- Admin sign-in e2e flow (would need a known scrypt hash; deferred to phase E along with rate limiting).
- DB-backed e2e (transactional hold race-condition test needs a Postgres service in CI).

---

## Rollback

This phase only adds files plus a one-line script and an existing-test fix. Rolling back:

- Remove `tests/e2e/`, `.github/workflows/ci.yml`, `playwright.config.ts`.
- Revert the additions to `package.json` (`test:e2e`, `test:e2e:ui`, `@playwright/test` devDependency).
- Revert the `lib/services/availability.test.ts` time-mock additions (the original two assertions will break once the wall clock leaves April 2026 again).
- Revert `vitest.config.ts` exclude block.

No DB schema change, no env, no runtime code path touched.
