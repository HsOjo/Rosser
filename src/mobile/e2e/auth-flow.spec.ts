import { test, expect } from "@playwright/test";

const API_URL = process.env.ROSSER_API_URL || "http://127.0.0.1:8000";
const TOKEN = process.env.ROSSER_TOKEN || "dev-token-change-me";

async function clearStorage(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    localStorage.removeItem("rosser_config");
    localStorage.removeItem("rosser_ui");
  });
}

async function seedSubscription(): Promise<{ categoryId: string; subscriptionId: string }> {
  const categoryRes = await fetch(`${API_URL}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ title: `e2e-cat-${Date.now()}`, description: "E2E" }),
  });
  if (!categoryRes.ok) throw new Error(`Failed to create category: ${categoryRes.status}`);
  const category = await categoryRes.json();

  const previewRes = await fetch(`${API_URL}/api/subscriptions/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ url: "https://hnrss.org/newest?points=100" }),
  });
  if (!previewRes.ok) throw new Error(`Failed to preview subscription: ${previewRes.status}`);
  const preview = await previewRes.json();

  const subRes = await fetch(`${API_URL}/api/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      title: preview.title || `e2e-sub-${Date.now()}`,
      description: preview.description || "",
      url: "https://hnrss.org/newest?points=100",
      category_id: category.id,
      refresh_interval: 60,
    }),
  });
  if (!subRes.ok) throw new Error(`Failed to create subscription: ${subRes.status}`);
  const subscription = await subRes.json();

  await fetch(`${API_URL}/api/subscriptions/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ ids: [subscription.id] }),
  });

  let attempts = 0;
  while (attempts < 30) {
    const articlesRes = await fetch(
      `${API_URL}/api/articles?subscription_id=${subscription.id}&page=1&size=1`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    const articles = await articlesRes.json();
    if (articles.items?.length > 0) break;
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;
  }

  return { categoryId: category.id, subscriptionId: subscription.id };
}

async function cleanupCategoryByTitle(title: string) {
  const res = await fetch(`${API_URL}/api/categories`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) return;
  const categories = await res.json();
  const cat = categories.find((c: any) => c.title === title);
  if (!cat) return;
  await fetch(`${API_URL}/api/categories/${cat.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
}

async function cleanupTagByTitle(title: string) {
  const res = await fetch(`${API_URL}/api/tags`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) return;
  const tags = await res.json();
  const tag = tags.find((t: any) => t.title === title);
  if (!tag) return;
  await fetch(`${API_URL}/api/tags/${tag.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
}

async function cleanupSeed(categoryId: string, subscriptionId: string) {
  await fetch(`${API_URL}/api/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  await fetch(`${API_URL}/api/categories/${categoryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/onboarding");
  await page.waitForTimeout(500);
  await clearStorage(page);
  await page.reload();
  await page.waitForTimeout(800);

  await expect(page.locator("text=欢迎来到 Rosser")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("下一步")');
  await page.waitForTimeout(500);

  await expect(page.locator('text=服务器地址').first()).toBeVisible({ timeout: 5000 });
  const inputs = page.locator("input");
  await inputs.nth(0).fill(API_URL);
  await inputs.nth(1).fill(TOKEN);
  await page.click('button:has-text("连接")');
  await page.waitForURL("**/", { waitUntil: "domcontentloaded", timeout: 10000 });
  await expect(page.locator('[data-testid="article-cell"]').first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(1500);
}

let seededCategoryId = "";
let seededSubscriptionId = "";

test.beforeAll(async () => {
  const seed = await seedSubscription();
  seededCategoryId = seed.categoryId;
  seededSubscriptionId = seed.subscriptionId;
});

test.afterAll(async () => {
  if (seededCategoryId && seededSubscriptionId) {
    await cleanupSeed(seededCategoryId, seededSubscriptionId);
  }
});

test.describe("Mobile E2E - Authenticated Flow", () => {
  test("onboarding → login → home → article → back → settings → disconnect", async ({ page }) => {
    const tagName = `e2e-tag-${Date.now()}`;
    try {
      await login(page);

      const articleCells = page.locator('[data-testid="article-cell"]');
      await expect(articleCells.first()).toBeVisible({ timeout: 10000 });
      const count = await articleCells.count();
      expect(count).toBeGreaterThan(0);
      console.log(`Home loaded with ${count} articles`);

      await articleCells.first().click();
      await page.waitForURL(/article\/.+/, { timeout: 10000 });
      await expect(page.locator('[data-testid="article-back"]')).toBeVisible({ timeout: 5000 });
      console.log("Article detail page loaded");

      await page.click('[data-testid="article-back"]');
      await page.waitForURL("**/", { timeout: 10000 });
      await expect(articleCells.first()).toBeVisible();
      console.log("Back to home");

      await page.click('[data-testid="settings-btn"]');
      await page.waitForURL(/settings/, { timeout: 10000 });
      await expect(page.locator("text=通用")).toBeVisible({ timeout: 5000 });
      console.log("Settings page loaded");

      await page.click('text=标签');
      await page.waitForTimeout(500);

      await page.click('[data-testid="add-tag-btn"]');
      const visibleInputs = page.locator('input[type="text"]');
      await visibleInputs.nth(0).fill(tagName);
      await page.click('button:has-text("保存")');
      await page.waitForTimeout(800);
      await expect(page.locator(`text=${tagName}`)).toBeVisible();
      console.log(`Tag "${tagName}" created`);

      await page.click('text=通用');
      await page.waitForTimeout(300);

      await page.click('button:has-text("断开连接")');
      await page.waitForURL(/onboarding/, { timeout: 10000 });
      await expect(page.locator("text=服务器地址").first()).toBeVisible({ timeout: 5000 });
      console.log("Disconnect passed, back to onboarding");
    } finally {
      await cleanupTagByTitle(tagName);
    }
  });

  test("home filter and search", async ({ page }) => {
    await login(page);

    const articleCells = page.locator('[data-testid="article-cell"]');
    await expect(articleCells.first()).toBeVisible({ timeout: 10000 });

    await page.click('[data-testid="menu-btn"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="nav-unread"]');
    await page.waitForTimeout(500);
    await expect(articleCells.first()).toBeVisible({ timeout: 5000 });

    await page.click('[data-testid="search-btn"]');
    const homeInputs = page.locator('input[type="text"]');
    await homeInputs.first().fill("claude");
    await page.waitForTimeout(800);
    const searchCount = await articleCells.count();
    console.log(`Search results: ${searchCount} articles`);

    await homeInputs.first().fill("");
    await page.waitForTimeout(300);
    console.log("Filter and search passed");
  });

  test("manage page - category, subscription and site", async ({ page }) => {
    const catName = `e2e-cat-${Date.now()}`;
    try {
      await login(page);

      await page.click('[data-testid="manage-btn"]');
      await page.waitForURL(/manage/, { timeout: 10000 });
      await expect(page.locator("text=分类")).toBeVisible({ timeout: 5000 });

      await page.click("text=分类");
      await page.waitForTimeout(500);

      const manageInputs = page.locator('input[type="text"]');
      await manageInputs.nth(0).fill(catName);
      await page.click('[data-testid="add-category-btn"]');
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${catName}`)).toBeVisible();
      console.log(`Category "${catName}" created`);

      await page.click("text=订阅");
      await page.waitForTimeout(500);

      await manageInputs.first().fill("https://hnrss.org/newest?points=100");
      await page.click('button:has-text("预览")');
      await expect(page.locator('button:has-text("添加")').first()).toBeVisible({ timeout: 30000 });

      const inputCount = await manageInputs.count();
      expect(inputCount).toBeGreaterThan(1);
      console.log("Subscription preview passed");

      await page.click("text=站点");
      await page.waitForTimeout(500);
      await expect(page.locator('button:has-text("保存")').first()).toBeVisible();
      console.log("Sites tab loaded");
    } finally {
      await cleanupCategoryByTitle(catName);
    }
  });

  test("notifications page", async ({ page }) => {
    await login(page);

    await page.click('[data-testid="notifications-btn"]');
    await page.waitForURL(/notifications/, { timeout: 10000 });
    await expect(page.locator('[data-testid="notifications-back"]')).toBeVisible();
    console.log("Notifications page loaded");
  });

  test("refresh preserves auth and returns to protected page", async ({ page }) => {
    await login(page);

    await page.click('[data-testid="notifications-btn"]');
    await page.waitForURL(/notifications/, { timeout: 10000 });
    await expect(page.locator("text=返回")).toBeVisible();

    await page.reload();
    await page.waitForURL(/notifications/, { timeout: 10000 });
    await expect(page.locator('[data-testid="notifications-back"]')).toBeVisible();
    console.log("Refresh preserved auth and returned to notifications");
  });
});
