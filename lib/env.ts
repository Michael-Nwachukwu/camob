const DEFAULT_NEXTAUTH_SECRET = "camob-dev-secret";
const DEFAULT_ADMIN_PASSWORD = "change-me";

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@camobresidence.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? DEFAULT_NEXTAUTH_SECRET,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  notificationFromEmail: process.env.NOTIFICATION_FROM_EMAIL ?? "reservations@camobresidence.com",
  bookingAlertEmail: process.env.BOOKING_ALERT_EMAIL ?? "camobresidence@gmail.com",
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
};

export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const problems: string[] = [];

  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET === DEFAULT_NEXTAUTH_SECRET) {
    problems.push("NEXTAUTH_SECRET is unset or using the dev default");
  }

  if (!process.env.NEXTAUTH_URL) {
    problems.push("NEXTAUTH_URL is unset");
  }

  if (!process.env.ADMIN_PASSWORD_HASH) {
    problems.push("ADMIN_PASSWORD_HASH is unset (generate with `npm run hash:password <password>`)");
  }

  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
    problems.push("ADMIN_PASSWORD is still the dev default — remove it or set ADMIN_PASSWORD_HASH instead");
  }

  if (problems.length > 0) {
    throw new Error(
      `[camob] Refusing to start in production:\n  - ${problems.join("\n  - ")}`
    );
  }
}
