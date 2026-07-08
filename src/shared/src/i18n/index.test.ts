import { describe, it, expect } from "vitest";
import { renderNotification } from "./index.js";

describe("i18n", () => {
  it("renders new articles notification in Chinese", () => {
    const result = renderNotification("articles.new", { subscription_title: "Tech", count: 5 }, "zh-CN");
    expect(result).toBe("Tech 新增 5 篇文章");
  });

  it("renders fetch error in English", () => {
    const result = renderNotification("fetch.error", { subscription_title: "News" }, "en");
    expect(result).toBe("News fetch failed");
  });

  it("falls back to English when locale missing", () => {
    const result = renderNotification("articles.new", { subscription_title: "X", count: 1 }, "fr-FR");
    expect(result).toBe("X has 1 new articles");
  });

  it("returns template key when type unknown", () => {
    const result = renderNotification("unknown.type", {}, "en");
    expect(result).toBe("notification.unknown.type");
  });

  it("handles missing params gracefully", () => {
    const result = renderNotification("articles.new", null, "zh-CN");
    expect(result).toBe("{{subscription_title}} 新增 {{count}} 篇文章");
  });
});
