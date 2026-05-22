# Self-hosting Camob Residence on a Hetzner VPS

A complete, beginner-friendly walkthrough: from a fresh Hetzner server to a live, HTTPS booking site with its own database, automatic hold-expiry, and nightly backups.

Everything runs in Docker, so the whole project lives in one folder and can be removed cleanly. You can host other projects on the same box alongside it.

**Rough cost:** Hetzner CX22 (2 vCPU / 4 GB) ≈ €4.50/mo. That single box runs this app, its Postgres database, and has room for several more small projects.

---

## What you'll end up with

```
   your domain ─DNS─▶ Hetzner VPS
                        │
                        ├─ Caddy        :80/:443  (automatic HTTPS)
                        │     │ reverse proxy
                        ├─ app          :3000     (Next.js standalone)
                        ├─ db           :5432     (Postgres, private)
                        └─ cron                   (pings expire-holds each minute)
```

Only ports 22 (SSH), 80, and 443 are exposed to the internet. Postgres stays private inside Docker.

---

## 1. Create the server

1. Sign up at [hetzner.com/cloud](https://www.hetzner.com/cloud), create a new project.
2. **Add Server**:
   - Location: closest to your guests (e.g. a EU/US region; Hetzner has no Africa region, so pick the lowest-latency one — usually a EU location for Nigeria).
   - Image: **Ubuntu 24.04**.
   - Type: **CX22** (shared vCPU) is plenty.
   - SSH key: add your public key (`cat ~/.ssh/id_ed25519.pub` — if you don't have one, run `ssh-keygen -t ed25519` first). This is how you log in.
   - Create.
3. Note the server's **public IPv4 address**.

---

## 2. Point your domain at it

In your domain registrar's DNS settings, add:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `<server-ip>` |
| A | `www` | `<server-ip>` |

DNS can take a few minutes to a couple of hours to propagate. You can continue setup meanwhile; HTTPS just won't issue until DNS resolves.

---

## 3. First login + basic hardening

```bash
ssh root@<server-ip>
```

Create a non-root user and give it sudo:

```bash
adduser camob
usermod -aG sudo camob
rsync --archive --chown=camob:camob ~/.ssh /home/camob   # copy your SSH key over
```

Set up the firewall (allow SSH + web only):

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

From now on, log in as the new user: `ssh camob@<server-ip>`.

---

## 4. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker camob
```

Log out and back in (`exit`, then `ssh camob@<server-ip>`) so the group change takes effect. Verify:

```bash
docker --version
docker compose version
```

---

## 5. Get the code + secrets onto the server

```bash
git clone <your-repo-url> camob
cd camob
cp .env.production.example .env.production
```

Generate the secrets **locally on your laptop** (so the password never goes over the wire as plaintext), then paste the results into `.env.production` on the server with `nano .env.production`:

```bash
# On your laptop:
openssl rand -hex 32                 # → NEXTAUTH_SECRET
openssl rand -hex 32                 # → CRON_SECRET
openssl rand -hex 32                 # → POSTGRES_PASSWORD (use the same value in DATABASE_URL)
npm run hash:password 'your-admin-password'   # → ADMIN_PASSWORD_HASH
```

Fill in `.env.production`:

- `DOMAIN` — your domain (e.g. `camobresidence.com`)
- `POSTGRES_PASSWORD` — the random string above
- `DATABASE_URL` — `postgresql://camob:<that-same-password>@db:5432/camob`
- `NEXTAUTH_SECRET`, `CRON_SECRET` — the random strings
- `NEXTAUTH_URL` — `https://<your-domain>`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — from your Paystack dashboard (live keys)
- `RESEND_API_KEY` (optional)

> Don't set a plaintext `ADMIN_PASSWORD` in production — the hash is what's used.

Also update the real account number in `lib/data/camob.ts` → `siteCopy.bankTransfer.accountNumber` (and the coordinates) before going live.

---

## 6. Build, set up the database, go live

```bash
docker compose build
docker compose run --rm migrate     # creates the tables (prisma db push)
docker compose run --rm seed        # apartments, units, rate plans
docker compose up -d                # start app + db + caddy + cron
```

Watch it come up:

```bash
docker compose logs -f app
```

Once DNS has propagated, visit `https://<your-domain>`. Caddy will have fetched an HTTPS certificate automatically. Sign in at `/admin` with your admin email + password.

---

## 7. Register the Paystack webhook

In the Paystack dashboard → **Settings → API Keys & Webhooks**, set the webhook URL to:

```
https://<your-domain>/api/payments/paystack/webhook
```

Make a test booking with a Paystack test card and confirm it flips to `confirmed` in `/admin/bookings`.

---

## 8. Backups (do not skip — this holds real booking + payment data)

Create a backup script:

```bash
mkdir -p ~/backups
nano ~/backup-camob.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /home/camob/camob
STAMP=$(date +%F-%H%M)
docker compose exec -T db pg_dump -U camob camob | gzip > "/home/camob/backups/camob-$STAMP.sql.gz"
# keep the last 14 days
find /home/camob/backups -name 'camob-*.sql.gz' -mtime +14 -delete
```

```bash
chmod +x ~/backup-camob.sh
crontab -e
```

Add a nightly run at 03:00:

```
0 3 * * * /home/camob/backup-camob.sh >> /home/camob/backups/backup.log 2>&1
```

**Get the dumps off the box too.** A local backup won't survive a disk failure. Cheapest option: a [Hetzner Storage Box](https://www.hetzner.com/storage/storage-box) — mount it or `rsync` your `~/backups` folder to it nightly. (Or `rclone` to any S3-compatible bucket.)

To restore a dump:

```bash
gunzip -c ~/backups/camob-<stamp>.sql.gz | docker compose exec -T db psql -U camob camob
```

---

## 9. Deploying updates

```bash
cd ~/camob
git pull
docker compose up -d --build
docker compose run --rm migrate     # only when the Prisma schema changed
```

Zero-downtime isn't configured (single box), but a rebuild swap is a few seconds.

---

## 10. Hosting other projects on the same box

Each project gets its own folder and its own `docker-compose.yml`. The catch is the web ports (80/443) — only one thing can own them. Two clean options:

- **Per-project Caddy on different domains:** keep each project's Caddy, but that means only one can bind 80/443. So instead →
- **One shared reverse proxy** (recommended): run a single Caddy (or Traefik) container that owns 80/443 and routes by domain to each project's app container over a shared Docker network. Each project's compose then exposes its app on the shared network instead of running its own Caddy.

If/when you add a second project, tell me and I'll wire up the shared-proxy version — it's a small change to this compose file.

---

## 11. Removing the project

```bash
cd ~/camob
docker compose down -v     # stops everything and deletes the database volume
cd ..
rm -rf camob
```

`-v` also removes the Postgres data volume, so **take a final backup first** if you might want the data. Nothing is left scattered on the system — that's the upside of the all-in-Docker setup.

---

## Troubleshooting

- **`Refusing to start in production`** in `docker compose logs app` — a required secret in `.env.production` is missing or still a dev default. The message names which one. Fix it and `docker compose up -d`.
- **HTTPS not issuing** — DNS hasn't propagated, or ports 80/443 aren't open (`ufw status`). Caddy retries automatically; check `docker compose logs caddy`.
- **App can't reach the database** — confirm `DATABASE_URL` uses host `db` (the service name), not `localhost`, and that the password matches `POSTGRES_PASSWORD`.
- **Holds not expiring** — check `docker compose logs cron`; confirm `CRON_SECRET` in `.env.production` matches what the app expects.
