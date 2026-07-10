import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route, request) => {
      if (request.method() === "PUT") {
        const body = request.postDataJSON();
        await route.fulfill({ json: body });
      } else {
        await route.fulfill({ json: { proxy: { enabled: false, url: null }, ui: { theme: "auto" } } });
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

    await page.goto("/");
    await page.getByRole("button").nth(4).click();
  });

  test("displays settings form", async ({ page }) => {
    await expect(page.locator("text=设置").first()).toBeVisible();
    await expect(page.locator("text=主题")).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
  });

  test("updates settings and shows connection info", async ({ page }) => {
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.locator("text=代理")).toBeVisible();
  });

  test("disconnect returns to onboarding", async ({ page }) => {
    await page.locator('text=连接').click();
    await page.getByRole("button", { name: "断开连接" }).click();
    await page.waitForURL("/onboarding");
    await expect(page).toHaveURL("/onboarding");
  });
});
