# Camob Residence

Camob Residence is a Next.js shortlet booking platform for the Camob apartments in Ogombo, Lekki. It includes:

- A luxury editorial public website
- Apartment details, gallery, map, and neighborhood guide
- Live availability calendar and reservation quote flow
- Booking hold logic for instant booking
- Paystack initialization and webhook endpoints
- Staff-facing admin pages for bookings, calendar visibility, units, rates, and blackout dates

## Getting started

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. If you have PostgreSQL ready, run `npm run db:generate`, `npm run db:migrate:dev -- --name init`, and `npm run db:seed`.
4. Start the app with `npm run dev`.

The app ships with a seeded in-memory fallback so the public UI and admin UI can still render even before a database is connected.

## Database workflow

Use Prisma migrations for all real schema changes.

- `npm run db:migrate:dev -- --name <change-name>` creates and applies a local migration
- `npm run db:migrate:deploy` applies checked-in migrations in staging/production
- `npm run db:migrate:status` shows whether an environment is up to date
- `npm run db:seed` seeds only stable reference data
- `npm run db:seed:demo` seeds the reference data plus demo bookings for local QA

The seed script is idempotent, so it can be rerun safely. Demo bookings are opt-in and controlled by `SEED_DEMO_DATA=true`.

The first time you create a migration, Prisma will generate the `prisma/migrations` folder for this repository.

Detailed local, staging, and production database commands live in [docs/prisma-workflow.md](/Users/michaelnwachukwu/Documents/works/camob/docs/prisma-workflow.md).

## Admin access

Use the credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD` on `/admin/sign-in`.

## Notes

- Real merchant credentials are required for live Paystack payments.
- Real photos, exact coordinates, and final legal copy should be added before production launch.
