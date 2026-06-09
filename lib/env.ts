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
  // Public base URL for links in emails (booking page, admin). Falls back for dev.
  appUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  cronSecret: process.env.CRON_SECRET,
  bookingLookupSecret: process.env.BOOKING_LOOKUP_SECRET,
  // Argens — autonomous-payment rails for AI agents (USDC on Stellar).
  // Concierge, itinerary, admin co-pilot, and the weekly brief all route paid
  // LLM/marketplace calls through here. When `argensApiKey` is unset, every
  // agent short-circuits to a graceful fallback (parallel to the Resend skip).
  argensApiKey: process.env.ARGENS_API_KEY,
  argensBaseUrl: process.env.ARGENS_BASE_URL ?? "https://api.argens.xyz/v1",
  // Marketplace service identifiers — verified against the live argens
  // catalogue (run scripts/argens-discover.ts to inspect alternatives).
  //   - Anthropic Claude via OpenAI-compatible chat-completions: free (provider passthrough)
  //   - Brave web-search: $0.035/req — we don't have a true local-events service yet,
  //     so the weekly brief web-searches "events in Lagos this week" then digests it
  //   - StableEmail relay send: $0.020/req, no inbox setup required
  argensLlmService: process.env.ARGENS_LLM_SERVICE ?? "anthropic_chat_completions",
  argensLlmModel: process.env.ARGENS_LLM_MODEL ?? "claude-haiku-4-5-20251001",
  argensEventsService: process.env.ARGENS_EVENTS_SERVICE ?? "brave_brave_web-search",
  argensMailService: process.env.ARGENS_MAIL_SERVICE ?? "stableemail_send",
  argensFromAddress: process.env.ARGENS_FROM_ADDRESS ?? "agent@camobresidence.com",
  // Spending policies (USDC, decimal strings — argens uses 7-decimal precision).
  // Empty means "no cap" per argens convention.
  argensMaxTransactionLimit: process.env.ARGENS_MAX_TRANSACTION_LIMIT,
  argensAllowanceLimit: process.env.ARGENS_ALLOWANCE_LIMIT,
  argensApprovalThreshold: process.env.ARGENS_APPROVAL_THRESHOLD,
  // Recipient for the weekly market-positioning brief. Falls back to the
  // existing booking-alert inbox so it lands somewhere useful out of the box.
  weeklyBriefRecipient: process.env.WEEKLY_BRIEF_RECIPIENT ?? process.env.BOOKING_ALERT_EMAIL ?? "camobresidence@gmail.com"
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
