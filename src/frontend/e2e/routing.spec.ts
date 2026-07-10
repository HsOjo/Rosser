import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Main - Routing sync", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      await route.fulfill({ json: { proxy: { enabled: false, url: null }, ui: { theme: "auto" } } });
    });
    await page.route("**/api/categories", async (route) => {
      await route.fulfill({ json: [{ id: "cat-1", title: "Tech" }] });
    });
    await page.route("**/api/subscriptions", async (route) => {
      await route.fulfill({ json: [{ id: "sub-1", title: "Hacker News", url: "https://news.ycombinator.com/rss", category_id: "cat-1" }] });
    });
    await page.route("**/api/sites", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route("**/api/tags", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route("**/api/notifications/unread-count", async (route) => {
      await route.fulfill({ json: 0 });
    });
    await page.route("**/api/articles/read", async (route) => {
      await route.fulfill({ status: 204 });
    });
    await page.route("**/api/articles/star", async (route) => {
      await route.fulfill({ status: 204 });
    });

    await page.route("**/api/articles/*", async (route) => {
      const url = new URL(route.request().url());
      if (/^\/api\/articles\/[^/]+$/.test(url.pathname)) {
        return route.fulfill({
          json: {
            id: "a1",
            title: "Article One",
            summary: "<p>Hello world</p>",
            is_read: false,
            is_star: false,
            publish_time: "2024-01-15T08:00:00Z",
            content: [{ type: "text/html", value: "<p>Hello world</p>" }],
          },
        });
      }
      await route.continue();
    });

    await page.route("http://localhost:8000/api/articles*", async (route) => {
      const url = new URL(route.request().url());
      const isStar = url.searchParams.get("is_star");
      const subId = url.searchParams.get("subscription_id");

      if (isStar === "true") {
        return route.fulfill({
          json: {
            items: [{ id: "a2", title: "Starred Article", summary: "summary 2", is_read: true, is_star: true, publish_time: "2024-01-15T10:00:00Z" }],
            total: 1, page: 1, size: 20,
          },
        });
      }

      if (subId === "sub-1") {
        return route.fulfill({
          json: {
            items: [{ id: "a3", title: "Subscribed Article", summary: "summary 3", is_read: false, is_star: false, publish_time: "2024-01-15T10:00:00Z" }],
            total: 1, page: 1, size: 20,
          },
        });
      }

      return route.fulfill({
        json: {
          items: [
            { id: "a1", title: "Article One", summary: "<p>Hello world</p>", is_read: false, is_star: false, publish_time: "2024-01-15T08:00:00Z" },
            { id: "a2", title: "Article Two", summary: "<p>Foo bar</p>", is_read: true, is_star: true, publish_time: "2024-01-14T08:00:00Z" },
          ],
          total: 2, page: 1, size: 20,
        },
      });
    });
  });

  test("syncs filter state to URL and restores on reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Article One")).toBeVisible();
    await expect(page.locator("text=Article Two")).toBeVisible();

    await page.click("text=星标");
    await expect(page).toHaveURL(/\?filter=starred/);
    await expect(page.locator("text=Starred Article")).toBeVisible();
    await expect(page.locator("text=Article One")).not.toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\?filter=starred/);
    await expect(page.locator("text=Starred Article")).toBeVisible();
    await expect(page.locator("text=Article One")).not.toBeVisible();
  });

  test("syncs subscription state to URL and restores on reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Article One")).toBeVisible();

    await page.click("text=Tech");
    await page.click("text=Hacker News");
    await expect(page).toHaveURL(/\?sub=sub-1/);
    await expect(page.locator("text=Subscribed Article")).toBeVisible();
    await expect(page.locator("text=Article One")).not.toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\?sub=sub-1/);
    await expect(page.locator("text=Subscribed Article")).toBeVisible();
    await expect(page.locator("text=Article One")).not.toBeVisible();
  });

  test("syncs opened article to URL and restores on reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Article One")).toBeVisible();

    await page.click("text=Article One");
    await expect(page).toHaveURL(/\?article=a1/);
    await expect(page.locator('role=paragraph >> text=Hello world')).toBeVisible();
    await expect(page.locator('role=dialog')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\?article=a1/);
    await expect(page.locator('role=paragraph >> text=Hello world')).toBeVisible();
    await expect(page.locator('role=dialog')).toBeVisible();
  });
});
