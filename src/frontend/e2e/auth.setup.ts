import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/onboarding");

  // Mock health check and settings APIs
  await page.route("**/api/health", async (route) => {
    await route.fulfill({ json: { status: "ok", version: "0.1.0" } });
  });
  await page.route("**/api/settings", async (route) => {
    await route.fulfill({ json: { id: "settings-1", auto_refresh_interval: null, theme: "auto", font_size: "medium" } });
  });

  await page.fill('input[placeholder*="服务器地址"]', "http://localhost:8000");
  await page.fill('input[type="password"]', "test-token");
  await page.getByRole("button", { name: /连接/ }).click();

  await page.waitForURL("/");
  await expect(page).toHaveURL("/");

  await page.context().storageState({ path: authFile });
});
