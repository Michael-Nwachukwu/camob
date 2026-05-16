# Phase 1 — security hardening, pre-deploy checklist

This phase closes the critical security holes flagged in the audit: unauthenticated admin APIs, default credentials, plaintext password, predictable payment refs, bank-transfer auto-confirm, and the webhook trusting client-reported amounts.

Before pushing to prod, every step in this doc has to be done. The app will refuse to boot if the env-var checks fail — that's intentional.

---

## 1. Generate production secrets

### 1a. NEXTAUTH_SECRET

Used to sign and encrypt the admin session JWT. If this is weak or predictable, an attacker can forge tokens and impersonate the admin.

```bash
openssl rand -hex 32
```

Copy the 64-char output. This is your `NEXTAUTH_SECRET`.

**Why:** Without a strong secret, all next-auth's cookie signing collapses. With the dev default (`"camob-dev-secret"`) anyone who reads our open-source-ish repo can forge an admin session.

### 1b. NEXTAUTH_URL

The canonical origin next-auth uses to build callback URLs and validate redirects.

- Production: `https://camobresidence.com` (or whatever the real domain is)
- Staging: the staging URL
- Vercel: you can set `NEXTAUTH_URL=https://${VERCEL_URL}` or pin the custom domain

**Why:** Mismatched origins break OAuth callbacks and post-login redirects. Even for credentials-only auth, next-auth uses this to validate redirects.

### 1c. ADMIN_PASSWORD_HASH

Generate an scrypt hash from your chosen admin password:

```bash
npm run hash:password 'your-real-password-here'
```

Output looks like:

```
ADMIN_PASSWORD_HASH=a1b2c3d4...:e5f6g7h8...
```

Copy the whole line. Use single quotes around the password so the shell doesn't expand `$`, `!`, etc.

**Why scrypt, not bcrypt or argon2:** scrypt is in node's standard library (no native dep), is memory-hard (resists GPU attacks), and is more than adequate for a single-admin app. Switching to bcrypt/argon2 later is a 30-line change.

---

## 2. Configure Paystack

### 2a. Get your secret key

1. Sign in to https://dashboard.paystack.com.
2. **Settings → API Keys & Webhooks**.
3. Copy the **Secret Key** (starts with `sk_live_…` for production, `sk_test_…` for staging/dev). This is `PAYSTACK_SECRET_KEY`.
4. Copy the **Public Key** (starts with `pk_…`). This is `PAYSTACK_PUBLIC_KEY`.

### 2b. Register the webhook URL

On the same page (Settings → API Keys & Webhooks):

- **Live URL:** `https://camobresidence.com/api/payments/paystack/webhook`
- **Test URL:** the staging URL or an ngrok tunnel for local testing

Paystack will start POSTing `charge.success` events to this endpoint. Our handler verifies the HMAC-SHA512 signature using `PAYSTACK_SECRET_KEY`.

### 2c. About PAYSTACK_WEBHOOK_SECRET

**You can leave this empty.** Paystack does not issue a separate webhook secret — they sign webhooks with your main secret key. The env var exists only as an escape hatch if Paystack ever changes that behaviour. Our verifier falls back to `PAYSTACK_SECRET_KEY`.

### 2d. Test the webhook

After deployment, trigger a test payment from the Paystack dashboard (**Transactions → Test**) and confirm:

1. The booking flips from `pending_payment` → `confirmed` in admin.
2. Logs show `200 ok` from the webhook handler.
3. A second delivery of the same event returns `{"ok":true,"idempotent":true}` and does **not** re-confirm.

---

## 3. Set production environment variables

Required keys in production:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<output of openssl rand -hex 32>"
NEXTAUTH_URL="https://camobresidence.com"
ADMIN_EMAIL="ops@camobresidence.com"
ADMIN_PASSWORD_HASH="<output of npm run hash:password>"
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
RESEND_API_KEY="re_..."                       # optional, falls back to DB logging
NOTIFICATION_FROM_EMAIL="reservations@camobresidence.com"
BOOKING_ALERT_EMAIL="camobresidence@gmail.com"
```

**Do NOT set `ADMIN_PASSWORD` in production.** The plaintext path is gated to `NODE_ENV !== "production"`, but removing it from env is good hygiene.

### Where to set these

- **Vercel:** Project → Settings → Environment Variables. Add each, set scope to **Production** (and Preview if you want staging to share them). Redeploy after changing.
- **Railway:** Service → Variables → New Variable.
- **Render:** Service → Environment → Add Environment Variable.
- **Fly.io:** `fly secrets set NEXTAUTH_SECRET=...` (per key).
- **Self-hosted Docker:** populate `.env.production` and reference it from your compose file / systemd unit.

### Removing ADMIN_PASSWORD from prod

- **Vercel:** Settings → Environment Variables → row for `ADMIN_PASSWORD` → click "..." → **Remove from Production**. Keep Development if you use plaintext locally.
- **Railway / Render:** delete the variable from the prod environment.
- **Docker / VPS:** remove the `ADMIN_PASSWORD=` line from `.env.production`.
- **Secret manager (AWS/GCP/Doppler):** delete the key from the prod environment scope.

---

## 4. Boot-time safety net

`instrumentation.ts` calls `assertProductionEnv()` on server startup. The app **refuses to start in production** if any of these are missing or use the dev default:

- `NEXTAUTH_SECRET` (unset or `"camob-dev-secret"`)
- `NEXTAUTH_URL` (unset)
- `ADMIN_PASSWORD_HASH` (unset)
- `ADMIN_PASSWORD` still set to `"change-me"`

If deployment crashes with `[camob] Refusing to start in production`, the error message names exactly which envs need attention. Fix and redeploy.

---

## 5. Post-deploy verification

Run these from your machine, replacing `https://camobresidence.com` with the real URL.

### 5a. Admin APIs reject unauthenticated callers

```bash
# All four should return HTTP 401 with {"error":"Unauthorized"}
curl -i https://camobresidence.com/api/admin/bookings
curl -i -X POST https://camobresidence.com/api/admin/blackouts \
  -H 'Content-Type: application/json' \
  -d '{"apartmentTypeId":"one-bedroom","startDate":"2026-06-01","endDate":"2026-06-02","reason":"test"}'
curl -i -X POST https://camobresidence.com/api/admin/rates \
  -H 'Content-Type: application/json' \
  -d '{"apartmentTypeId":"one-bedroom","nightlyRate":1,"serviceCharge":0}'
curl -i -X PATCH https://camobresidence.com/api/admin/bookings/anything \
  -H 'Content-Type: application/json' \
  -d '{"status":"confirmed"}'
```

If any of these return 200 or leak data, **stop the deploy and roll back**. The middleware matcher is the gate — confirm it's covering `/api/admin/:path*`.

### 5b. Webhook rejects unsigned bodies

```bash
curl -i -X POST https://camobresidence.com/api/payments/paystack/webhook \
  -H 'Content-Type: application/json' \
  -d '{"event":"charge.success","data":{"reference":"x","status":"success","amount":1,"metadata":{"bookingId":"x"}}}'
# Expect 401 {"error":"Invalid webhook signature."}
```

### 5c. Admin sign-in works

Visit `https://camobresidence.com/admin`. You should be redirected to `/admin/sign-in`. Sign in with `ADMIN_EMAIL` + the password you hashed in step 1c. After login, you reach the dashboard.

### 5d. End-to-end Paystack flow

1. Make a booking on the public site with `paymentMethod=paystack`, using a Paystack test card.
2. After redirect back to `/booking/success`, check admin → Bookings: the row should be `confirmed`, `paid`.
3. Replay the same webhook event from Paystack's dashboard. Booking status doesn't change; response is `{"ok":true,"idempotent":true}`.

### 5e. Bank-transfer booking stays pending

1. Make a booking with `paymentMethod=bank_transfer`.
2. Check admin → Bookings: status is `pending_payment`, paymentStatus is `pending_review`. **It should NOT auto-confirm.**
3. Admin manually flips it to `confirmed` after seeing the transfer.

---

## 6. Rollback

If anything in section 5 fails, roll back the deploy. The phase touches:

- `middleware.ts` (auth gating)
- `auth.ts` (password hash comparison)
- `lib/env.ts`, `instrumentation.ts` (boot-time assertions)
- `lib/services/booking.ts` (payment refs + bank-transfer fix)
- `app/api/payments/paystack/webhook/route.ts` (webhook hardening)
- `app/api/admin/*` (handler-level `requireAdmin` guards)

None of these change the DB schema, so a code rollback is sufficient — no migration to reverse.

---

## 7. What this phase does NOT fix

These remain open and are in the Milestone B–E backlog:

- Hold-creation race condition (no transactional check).
- In-memory store dual-writes (drifts between Next.js workers).
- No cron to expire stale holds.
- No guest-side booking lookup or cancel flow.
- Admin still uses the legacy design tokens.
- No e2e tests.
- No rate limiting.

See the audit report in the conversation history for the full backlog.
