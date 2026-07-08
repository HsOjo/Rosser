import { test, expect } from "@playwright/test";

const API_URL = "http://127.0.0.1:8000";
const TOKEN = "dev-token-change-me";

async function login(page: any) {
  await page.goto("/onboarding");
  await page.waitForTimeout(500);
  // Clear auth after navigation so localStorage is accessible
  await page.evaluate(() => {
    localStorage.removeItem("rosser_config");
    localStorage.removeItem("rosser_locale");
    location.reload();
  });
  await page.waitForTimeout(800);
  await expect(page.locator("text=连接")).toBeVisible({ timeout: 5000 });
  const inputs = page.locator(".var-input__input");
  await inputs.nth(0).fill(API_URL);
  await inputs.nth(1).fill(TOKEN);
  await page.click('button:has-text("连接")');
  await page.waitForURL("**\/", { timeout: 10000 });
  // Home page loaded - check app bar title instead of drawer content
  await expect(page.locator("text=Rosser")).toBeVisible({ timeout: 10000 });
  // Wait for article list to load
  await page.waitForTimeout(1500);
}

test.describe("Mobile E2E - Authenticated Flow", () => {
  test("onboarding → login → home → article → back → settings → disconnect", async ({ page }) => {
    await login(page);

    // Home - article list loaded
    const articleCells = page.locator(".var-cell");
    await expect(articleCells.first()).toBeVisible({ timeout: 10000 });
    const count = await articleCells.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Home loaded with ${count} articles`);

    // Open first article
    await articleCells.first().click();
    await page.waitForURL(/article\/.+/, { timeout: 10000 });
    await expect(page.locator("text=返回")).toBeVisible({ timeout: 5000 });
    console.log("Article detail page loaded");

    // Toggle star (if button visible)
    const starBtn = page.locator('button').filter({ hasText: /星标|Star/ }).first();
    if (await starBtn.isVisible().catch(() => false)) {
      await starBtn.click();
      await page.waitForTimeout(300);
    }

    // Toggle read
    const readBtn = page.locator('button').filter({ hasText: /已读|Read/ }).first();
    if (await readBtn.isVisible().catch(() => false)) {
      await readBtn.click();
      await page.waitForTimeout(300);
    }

    // Back to home
    await page.click('button:has-text("返回")');
    await page.waitForURL("**\/", { timeout: 10000 });
    await expect(page.locator(".var-cell").first()).toBeVisible();
    console.log("Back to home");

    // Go to Settings
    await page.goto("/settings");
    await page.waitForURL(/settings/, { timeout: 10000 });
    await expect(page.locator("text=通用")).toBeVisible({ timeout: 5000 });
    console.log("Settings page loaded");

    // Go to tags tab
    await page.click('text=标签');
    await page.waitForTimeout(500);

    // Add a new tag — use only inputs in the currently-visible tab
    const tagName = `e2e-tag-${Date.now()}`;
    const visibleInputs = page.locator('.var-tab-item:not([aria-hidden="true"]) .var-input__input');
    await visibleInputs.nth(0).fill(tagName);
    await page.click('button:has-text("添加")');
    await page.waitForTimeout(800);
    // Varlet chips render text inside .var-chip, use contains-text locator
    await expect(page.locator('.var-chip').filter({ hasText: tagName })).toBeVisible();
    console.log(`Tag "${tagName}" created`);

    // Go to connection tab and disconnect
    await page.click('text=连接');
    await page.waitForTimeout(300);
    await page.click('button:has-text("断开")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("确认")');
    await page.waitForURL(/onboarding/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: '连接' })).toBeVisible({ timeout: 5000 });
    console.log("Disconnect passed, back to onboarding");
  });

  test("home drawer filter and search", async ({ page }) => {
    await login(page);

    const articleCells = page.locator(".var-cell");
    await expect(articleCells.first()).toBeVisible({ timeout: 10000 });

    // Open drawer
    const menuBtn = page.locator('.var-app-bar__left button').first();
    await menuBtn.click();
    await page.waitForTimeout(300);

    // Click "未读" in drawer
    await page.click('text=未读');
    await page.waitForTimeout(500);
    // After clicking, drawer closes; check some articles are still visible or no data
    await expect(articleCells.first()).toBeVisible({ timeout: 5000 });

    // Search
    const homeInputs = page.locator('.var-input__input');
    await homeInputs.first().fill("claude");
    await page.waitForTimeout(800);
    const searchCount = await articleCells.count();
    console.log(`Search results: ${searchCount} articles`);

    // Clear search
    await homeInputs.first().fill("");
    await page.waitForTimeout(300);

    console.log("Drawer filter and search passed");
  });

  test("manage page - category and subscription", async ({ page }) => {
    await login(page);

    await page.goto("/manage");
    await page.waitForURL(/manage/, { timeout: 10000 });
    await expect(page.locator("text=分类")).toBeVisible({ timeout: 5000 });

    // Add category
    const catName = `e2e-cat-${Date.now()}`;
    const manageInputs = page.locator(".var-input__input");
    await manageInputs.nth(0).fill(catName);
    await page.click('button:has-text("添加")');
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${catName}`)).toBeVisible();
    console.log(`Category "${catName}" created`);

    // Switch to subscriptions tab
    await page.click('text=订阅');
    await page.waitForTimeout(500);

    // Preview subscription
    await manageInputs.first().fill("https://hnrss.org/newest?points=100");
    await page.click('button:has-text("预览")');
    await page.waitForTimeout(3000);

    const inputCount = await manageInputs.count();
    expect(inputCount).toBeGreaterThan(2);
    console.log("Subscription preview passed");
  });

  test("notifications page", async ({ page }) => {
    await login(page);

    await page.goto("/notifications");
    await page.waitForURL(/notifications/, { timeout: 10000 });
    await expect(page.locator("text=返回")).toBeVisible();
    console.log("Notifications page loaded");
  });
});
