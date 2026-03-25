export const env = {
  databaseUrl: process.env.DATABASE_URL,
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@camobresidence.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "change-me",
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "camob-dev-secret",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  notificationFromEmail: process.env.NOTIFICATION_FROM_EMAIL ?? "reservations@camobresidence.com",
  bookingAlertEmail: process.env.BOOKING_ALERT_EMAIL ?? "camobresidence@gmail.com",
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
};
