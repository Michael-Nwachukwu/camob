import { test, expect } from "@playwright/test";

test.describe("admin auth gating", () => {
  test("unauthenticated GET /api/admin/bookings returns 401 JSON", async ({ request }) => {
    const response = await request.get("/api/admin/bookings");
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("unauthenticated PATCH /api/admin/bookings/[id] returns 401", async ({ request }) => {
    const response = await request.patch("/api/admin/bookings/anything", {
      data: { status: "confirmed" }
    });
    expect(response.status()).toBe(401);
  });

  test("unauthenticated POST /api/admin/blackouts returns 401", async ({ request }) => {
    const response = await request.post("/api/admin/blackouts", {
      data: {
        apartmentTypeId: "one-bedroom",
        startDate: "2027-01-01",
        endDate: "2027-01-02",
        reason: "test"
      }
    });
    expect(response.status()).toBe(401);
  });

  test("unauthenticated GET /admin redirects to sign-in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });

  test("cron endpoint runs without secret in dev", async ({ request }) => {
    // In dev there's no CRON_SECRET; the endpoint should be reachable.
    const response = await request.post("/api/cron/expire-holds");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});
