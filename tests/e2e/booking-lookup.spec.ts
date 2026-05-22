import { test, expect } from "@playwright/test";

test.describe("booking lookup token gating", () => {
  test("missing token returns 404 (not 200 with leaked data)", async ({ page }) => {
    const response = await page.goto("/booking/does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("invalid token returns 404", async ({ page }) => {
    const response = await page.goto("/booking/anything?token=" + "a".repeat(24));
    expect(response?.status()).toBe(404);
  });

  test("bank-transfer screen 404s without a token", async ({ page }) => {
    const response = await page.goto("/booking/bank-transfer?bookingId=fake");
    expect(response?.status()).toBe(404);
  });

  test("cancel page 404s with an invalid token", async ({ page }) => {
    const response = await page.goto("/booking/anything/cancel?token=" + "a".repeat(24));
    expect(response?.status()).toBe(404);
  });

  test("cancel page 404s without a token", async ({ page }) => {
    const response = await page.goto("/booking/anything/cancel");
    expect(response?.status()).toBe(404);
  });
});
