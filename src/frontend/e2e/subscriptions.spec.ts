import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Subscriptions", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/settings", async (route) => {
      await route.fulfill({ json: { id: "s1", auto_refresh_interval: null, theme: "auto", font_size: "medium" } });
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

  test("add subscription flow", async ({ page }) => {
    await page.getByRole("button", { name: "添加订阅" }).click();
    await page.fill('input[placeholder="RSS URL"]', "https://example.com/feed.xml");

    const previewPromise = page.waitForResponse("**/api/subscriptions/preview");
    await page.getByRole("button", { name: "预览" }).click();
    await previewPromise;

    // Preview result populates the title input
    await expect(page.locator("input[value='Test Feed']")).toBeVisible();

    const createPromise = page.waitForResponse(
      (resp) => new URL(resp.url()).pathname === "/api/subscriptions" && resp.request().method() === "POST"
    );
    await page.locator('.n-modal button.n-button--primary-type').click();
    await createPromise;

    // Modal closes after successful creation
    await expect(page.locator('.n-modal')).not.toBeVisible();

    // Expand Uncategorized to find the newly created subscription
    await page.getByRole("menuitem", { name: "Uncategorized" }).click();
    await expect(page.locator("text=Test Feed")).toBeVisible();
  });
});
