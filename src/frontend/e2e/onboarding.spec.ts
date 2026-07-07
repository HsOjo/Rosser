import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
  });

  test("shows onboarding page", async ({ page }) => {
    await expect(page.locator("text=欢迎使用 Rosser")).toBeVisible();
    await expect(page.getByRole("button", { name: /连接/ })).toBeVisible();
  });

  test("connects with remote mode", async ({ page }) => {
    await page.route("**/api/health", async (route) => {
      await route.fulfill({ json: { status: "ok", version: "0.1.0" } });
    });

    await page.fill('input[placeholder*="服务器地址"]', "http://localhost:8000");
    await page.fill('input[type="password"]', "my-token");
    await page.getByRole("button", { name: /连接/ }).click();

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
