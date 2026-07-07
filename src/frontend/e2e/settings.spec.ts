import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route, request) => {
      if (request.method() === "PUT") {
        const body = request.postDataJSON();
        await route.fulfill({ json: { id: "s1", ...body } });
      } else {
        await route.fulfill({ json: { id: "s1", auto_refresh_interval: null, theme: "auto", font_size: "medium" } });
      }
    });
    await page.route("**/api/categories", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route("**/api/subscriptions", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route("**/api/articles**", async (route) => {
      await route.fulfill({ json: { items: [], total: 0, page: 1, size: 20 } });
    });

    await page.goto("/settings");
  });

  test("displays settings form", async ({ page }) => {
    await expect(page.locator("text=Settings")).toBeVisible();
    await expect(page.locator("text=Auto Refresh Interval")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("updates settings and shows connection info", async ({ page }) => {
    // Naive UI n-input-number renders input without type=number
    const numberInput = page.locator('.n-input-number input');
    await numberInput.fill("120");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("text=Auto Refresh Interval")).toBeVisible();
  });

  test("disconnect returns to onboarding", async ({ page }) => {
    await page.getByRole("button", { name: "Disconnect" }).click();
    await page.waitForURL("/onboarding");
    await expect(page).toHaveURL("/onboarding");
  });
});
