import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

function signBody(secret: string, body: string): string {
  return crypto.createHmac("sha512", secret).update(body).digest("hex");
}

describe("verifyPaystackWebhook", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts a body signed with the webhook secret", async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = "wh-secret";
    process.env.PAYSTACK_SECRET_KEY = "sk_test_unused";
    const { verifyPaystackWebhook } = await import("./payments");

    const body = JSON.stringify({ event: "charge.success", data: { reference: "r1" } });
    const sig = signBody("wh-secret", body);
    expect(verifyPaystackWebhook(body, sig)).toBe(true);
  });

  it("falls back to the secret key when no dedicated webhook secret is set", async () => {
    delete process.env.PAYSTACK_WEBHOOK_SECRET;
    process.env.PAYSTACK_SECRET_KEY = "sk_test_main";
    const { verifyPaystackWebhook } = await import("./payments");

    const body = JSON.stringify({ event: "charge.success" });
    const sig = signBody("sk_test_main", body);
    expect(verifyPaystackWebhook(body, sig)).toBe(true);
  });

  it("rejects a body signed with the wrong secret", async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = "wh-secret";
    process.env.PAYSTACK_SECRET_KEY = "sk_test_unused";
    const { verifyPaystackWebhook } = await import("./payments");

    const body = JSON.stringify({ event: "charge.success" });
    const sig = signBody("attacker-guess", body);
    expect(verifyPaystackWebhook(body, sig)).toBe(false);
  });

  it("rejects when signature header is missing", async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = "wh-secret";
    const { verifyPaystackWebhook } = await import("./payments");

    expect(verifyPaystackWebhook("{}", null)).toBe(false);
  });

  it("rejects when no secret is configured at all", async () => {
    delete process.env.PAYSTACK_WEBHOOK_SECRET;
    delete process.env.PAYSTACK_SECRET_KEY;
    const { verifyPaystackWebhook } = await import("./payments");

    expect(verifyPaystackWebhook("{}", "any-signature")).toBe(false);
  });

  it("rejects when the body is tampered after signing", async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = "wh-secret";
    const { verifyPaystackWebhook } = await import("./payments");

    const original = JSON.stringify({ event: "charge.success", data: { amount: 100 } });
    const sig = signBody("wh-secret", original);
    const tampered = JSON.stringify({ event: "charge.success", data: { amount: 100000000 } });
    expect(verifyPaystackWebhook(tampered, sig)).toBe(false);
  });
});
