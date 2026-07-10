import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Subscriptions", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      await route.fulfill({ json: { proxy: { enabled: false, url: null }, ui: { theme: "auto" } } });
    });
    await page.route("**/api/categories", async (route) => {
      await route.fulfill({ json: [{ id: "cat-1", title: "Tech" }] });
    });
    await page.route("**/api/subscriptions/preview", async (route) => {
      await route.fulfill({ json: { title: "Test Feed", description: "A test feed" } });
    });
    await page.route("**/api/subscriptions", async (route, request) => {
      if (request.method() === "POST") {
        await route.fulfill({ json: { id: "sub-new", title: "Test Feed", url: "https://example.com/feed.xml", category_id: null } });
      } else {
        await route.fulfill({ json: [{ id: "sub-1", title: "Hacker News", url: "https://news.ycombinator.com/rss", category_id: "cat-1" }] });
      }
    });
    await page.route(
      (url) => new URL(url).pathname === "/api/articles",
      async (route) => {
        await route.fulfill({ json: { items: [], total: 0, page: 1, size: 20 } });
      }
    );

    await page.goto("/");
    await page.getByRole("menuitem", { name: "Tech" }).click();
    await expect(page.locator("text=Hacker News")).toBeVisible();
  });

  test("subscription appears in sidebar", async ({ page }) => {
    await expect(page.locator("text=Hacker News")).toBeVisible();
  });

  test.fixme("add subscription flow", async () => {});
});
