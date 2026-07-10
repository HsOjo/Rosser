import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
    await page.evaluate(() => {
      localStorage.removeItem("rosser_ui");
      localStorage.removeItem("rosser_server");
    });
    await page.reload();
  });

  test("shows onboarding page", async ({ page }) => {
    await expect(page.locator("text=欢迎使用 Rosser")).toBeVisible();
    await expect(page.locator("text=偏好设置")).toBeVisible();
    await expect(page.getByText("服务器连接", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /下一步|Next/ })).toBeVisible();
  });

  test("connects with remote mode", async ({ page }) => {
    await page.route("**/api/health", async (route) => {
      await route.fulfill({ json: { status: "ok", version: "0.1.0" } });
    });

    await page.getByRole("button", { name: /下一步|Next/ }).click();
    await page.getByPlaceholder(/服务器地址|Server URL/).fill("http://localhost:8000");
    await page.getByPlaceholder(/访问令牌|Access Token/).fill("my-token");
    await page.getByRole("button", { name: /连接|Connect/ }).click();

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
