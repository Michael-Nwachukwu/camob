-- Database-level backstop against double-booking.
-- Prisma can't express EXCLUDE constraints, so this is applied as raw SQL,
-- separately from `prisma db push`. It is idempotent — safe to run repeatedly.
--
-- Prerequisite: Booking.checkIn / checkOut must be `date` columns (the
-- @db.Date schema change applied via `prisma db push`). daterange() needs date
-- arguments, and the '[)' bound makes back-to-back stays (a check-in on the
-- prior stay's checkout day) NOT conflict.
--
-- Pre-flight: this ALTER fails if existing rows already violate it. Run the
-- detector in docs/deploy-phase-6.md and resolve any overlaps first.

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_overlap') THEN
    ALTER TABLE "Booking"
      ADD CONSTRAINT booking_no_overlap
      EXCLUDE USING gist (
        "unitId" WITH =,
        daterange("checkIn", "checkOut", '[)') WITH &&
      )
      WHERE (status IN ('DRAFT_HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'ADMIN_BLOCKED'));
  END IF;
END
$$;
