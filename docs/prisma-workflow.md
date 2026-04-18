# Prisma Workflow

This project uses Prisma with PostgreSQL. Use migration files as the source of truth for schema changes.

## Local development

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Set a local Postgres connection string in `DATABASE_URL`.

3. Generate the Prisma client:

```bash
npm run db:generate
```

4. Create and apply the initial migration:

```bash
npm run db:migrate:dev -- --name init
```

5. Seed stable reference data:

```bash
npm run db:seed
```

6. If you want demo bookings and demo payments for UI testing:

```bash
npm run db:seed:demo
```

7. Start the app:

```bash
npm run dev
```

When you change the Prisma schema later, create a new migration with:

```bash
npm run db:migrate:dev -- --name describe_your_change
```

Examples:

```bash
npm run db:migrate:dev -- --name add_guest_indexes
npm run db:migrate:dev -- --name add_email_logs
```

## Staging

Staging should use a hosted Postgres database and checked-in migrations from git.

1. Set staging env vars, especially `DATABASE_URL`.
2. Deploy the code.
3. Apply migrations:

```bash
npm run db:migrate:deploy
```

4. Seed stable reference data once:

```bash
npm run db:seed
```

5. If you want staging to include demo bookings for internal testing only:

```bash
npm run db:seed:demo
```

6. Verify migration state:

```bash
npm run db:migrate:status
```

Recommended staging behavior:

- Use real schema migrations
- Use test Paystack keys
- Use a verified but non-production email setup if possible
- Only seed demo bookings if the staging environment is private

## Production

Production should never rely on `prisma db push` for schema rollout.

1. Set production env vars, especially `DATABASE_URL`.
2. Deploy the code version that contains the checked-in migration files.
3. Apply migrations:

```bash
npm run db:migrate:deploy
```

4. Seed only stable reference data if this is the first production setup:

```bash
npm run db:seed
```

5. Check migration state:

```bash
npm run db:migrate:status
```

Production rules:

- Do not run `npm run db:seed:demo`
- Do not use `npm run db:push` as the normal deployment path
- Do not edit production tables manually unless you are handling an emergency
- Create every schema change locally first with `db:migrate:dev`, commit the generated migration files, then deploy them with `db:migrate:deploy`

## Why `db:push` is still in the repo

`npm run db:push` remains available for quick experiments, disposable preview environments, or emergency prototyping. It is not the canonical production workflow.

Use it only when you intentionally do not need migration history.
