# Phase 6 — database-level double-booking hardening

Two changes that make double-booking structurally impossible, not just guarded by app logic:

1. **Date-only columns** (`@db.Date`) for `Booking.checkIn/checkOut` and `BlockedDateRange.startDate/endDate` — removes the timezone drift that broke back-to-back bookings on UTC+ servers (e.g. Nigeria/WAT).
2. **Postgres `EXCLUDE` constraint** (`booking_no_overlap`) — the DB physically rejects two *blocking* bookings whose date ranges overlap on the same unit, even if app logic ever has a hole or a race.

Both were applied + verified on the dev DB. Production needs the steps below.

## What changed in code

- `prisma/schema.prisma` — `checkIn`/`checkOut` and blackout `startDate`/`endDate` are now `DateTime @db.Date`.
- `lib/services/holds.ts` — already builds dates via `toUtcDate` (phase 5); now also catches the exclusion violation (Postgres `23P01`) and surfaces it as the friendly "Selected dates are no longer available" instead of a 500. The in-transaction overlap check stays as the first line; the constraint is the backstop for races.
- `prisma/sql/0001_booking_no_overlap.sql` — the constraint (idempotent; Prisma can't express `EXCLUDE`, so it's raw SQL applied separately from `db push`).

## Owner actions on prod (in order)

> Do this in a quiet window. Take a DB backup first (`pg_dump`).

### 1. Apply the date-column change
`prisma db push` treats `timestamp → date` as potential data loss (it drops the time component — which is always midnight for us, so it's lossless in practice). Pass the flag:

```bash
docker compose run --rm migrate npx prisma db push --accept-data-loss
```

### 2. Pre-flight: find any existing overlaps
The `EXCLUDE` constraint won't add if current rows already violate it. Detect them:

```bash
docker compose exec -T db psql -U camob -d camob -c "
SELECT a.id, a.\"unitId\", a.\"checkIn\", a.\"checkOut\"
FROM \"Booking\" a JOIN \"Booking\" b
  ON a.\"unitId\" = b.\"unitId\" AND a.id < b.id
 AND daterange(a.\"checkIn\", a.\"checkOut\", '[)') && daterange(b.\"checkIn\", b.\"checkOut\", '[)')
WHERE a.status IN ('DRAFT_HOLD','PENDING_PAYMENT','CONFIRMED','ADMIN_BLOCKED')
  AND b.status IN ('DRAFT_HOLD','PENDING_PAYMENT','CONFIRMED','ADMIN_BLOCKED');"
```

If it returns rows, resolve each (cancel/expire the wrong one) before step 3. (On dev this caught one leftover pre-fix duplicate, which we expired.)

### 3. Apply the constraint
```bash
docker compose exec -T db psql -U camob -d camob < prisma/sql/0001_booking_no_overlap.sql
docker compose exec -T db psql -U camob -d camob -c "SELECT conname FROM pg_constraint WHERE conname='booking_no_overlap';"
```

`CREATE EXTENSION btree_gist` needs a superuser — the `camob` role is the owner/superuser in the official Postgres image, so it works.

### 4. Redeploy the app
```bash
git pull && docker compose up -d --build
```
(brings the schema, `toUtcDate`, and the `23P01` handling.)

## Verification (mirrors what passed on dev)

```bash
# seed a confirmed booking, then try an overlap (must fail) and a back-to-back (must pass)
# — see the exact INSERT statements in this phase's dev run; key results:
#   overlap   2027-06-12 → 2027-06-15  →  ERROR: conflicting key value violates exclusion constraint "booking_no_overlap"
#   back-to-back 2027-06-13 → 2027-06-15  →  INSERT 0 1   (allowed — turnover day)
```

Also: book a turnover (check-in on a prior stay's checkout day) through the public site — it should succeed, not show "Selected dates are no longer available".

## Rollback

- Drop the constraint: `ALTER TABLE "Booking" DROP CONSTRAINT booking_no_overlap;`
- The `@db.Date` columns can stay (harmless); reverting them is a `db push` back to `DateTime` if ever needed.
- Code rollback is independent — the `toUtcDate` + `23P01` handling are backward-compatible with `timestamp` columns too.

## Caveats

- The raw SQL constraint is **not** tracked by `prisma db push`. If the prod DB is ever reset/recreated, re-run step 3.
- The constraint covers only the blocking statuses; cancelled/expired/refunded/refund_pending rows can freely overlap historically, which is correct.
