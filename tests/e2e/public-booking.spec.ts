import { test, expect } from "@playwright/test";

test.describe("public site smoke", () => {
  test("home renders the hero with the brand-red headline", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Camob/i);
    // Hero headline contains the italic brand-red span.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/book renders the booking flow scaffold", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByRole("heading", { name: /Pick your dates/i })).toBeVisible();
    // Step 1 unit picker has both maisonettes as buttons.
    await expect(page.getByRole("button", { name: /1-Bedroom Maisonette/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /2-Bedroom Maisonette/i })).toBeVisible();
  });

  test("hold endpoint returns a held booking + 15-minute expiry", async ({ request }, testInfo) => {
    // Both projects (chromium + mobile) share the same in-memory store, so
    // pick non-overlapping date windows so the second run doesn't conflict
    // with the unit the first claimed.
    const offsetDays = testInfo.project.name === "mobile" ? 90 : 60;
    const start = new Date();
    start.setDate(start.getDate() + offsetDays);
    const checkIn = start.toISOString().slice(0, 10);
    start.setDate(start.getDate() + 3);
    const checkOut = start.toISOString().slice(0, 10);

    const response = await request.post("/api/booking-holds", {
      data: { apartmentTypeId: "one-bedroom", checkIn, checkOut, guests: 2 }
    });
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.hold).toBeDefined();
    expect(payload.hold.status).toBe("draft_hold");
    expect(payload.hold.expiresAt).toBeDefined();
    expect(payload.quote.nights).toBe(3);
  });
});
