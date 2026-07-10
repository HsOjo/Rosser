import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/onboarding");

  // Simulate an already-initialized client so the welcome flow is skipped on
  // subsequent navigation checks. The connection config is saved after login.
  await page.evaluate(() => {
    localStorage.setItem("rosser_ui", JSON.stringify({ theme: "auto", locale: "zh-CN" }));
  });

  // Mock health check and settings APIs
  await page.route("**/api/health", async (route) => {
    await route.fulfill({ json: { status: "ok", version: "0.1.0" } });
  });
  await page.route("**/api/settings", async (route) => {
    await route.fulfill({ json: { proxy: { enabled: false, url: null }, ui: { theme: "auto" } } });
  });

  await page.getByPlaceholder(/服务器地址|Server URL/).fill("http://localhost:8000");
  await page.getByPlaceholder(/访问令牌|Access Token/).fill("test-token");
  await page.getByRole("button", { name: /连接|Connect/ }).click();

  await page.waitForURL("/");
  await expect(page).toHaveURL("/");

  await page.context().storageState({ path: authFile });
});
