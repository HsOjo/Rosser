import { describe, it, expect } from "vitest";
import type { components } from "@rosser/shared/api";

describe("shared API contract", () => {
  it("SettingsOut only contains proxy", () => {
    const settings: components["schemas"]["SettingsOut"] = {
      proxy: { enabled: false },
    };
    expect(settings).toEqual({ proxy: { enabled: false } });
    // @ts-expect-error theme should not exist on SettingsOut
    settings.theme;
    // @ts-expect-error font_size should not exist on SettingsOut
    settings.font_size;
    // @ts-expect-error auto_refresh_interval should not exist on SettingsOut
    settings.auto_refresh_interval;
  });

  it("ProxySettings has enabled and url", () => {
    const proxy: components["schemas"]["ProxySettings"] = {
      enabled: true,
      url: "http://proxy.example",
    };
    expect(proxy.enabled).toBe(true);
    expect(proxy.url).toBe("http://proxy.example");
  });

  it("SubscriptionOut has refresh_interval", () => {
    const sub: components["schemas"]["SubscriptionOut"] = {
      id: "sub-1",
      title: "Test",
      url: "http://test.com",
      refresh_interval: 60,
    };
    expect(sub.refresh_interval).toBe(60);
  });

  it("SubscriptionCreate requires refresh_interval", () => {
    const valid: components["schemas"]["SubscriptionCreate"] = {
      title: "x",
      url: "http://x.com",
      refresh_interval: 60,
    };
    expect(valid.refresh_interval).toBe(60);
  });

  it("ArticleListItem has state fields and tags", () => {
    const item: components["schemas"]["ArticleListItem"] = {
      id: "1",
      subscription_id: "sub-1",
      hash: "h",
      title: "t",
      is_read: false,
      is_hide: false,
      is_star: false,
      tags: [],
    };
    expect(item.is_read).toBe(false);
    expect(item.is_hide).toBe(false);
    expect(item.is_star).toBe(false);
    expect(item.tags).toEqual([]);
  });

  it("SiteOut has concurrency_limit and favicon_id", () => {
    const site: components["schemas"]["SiteOut"] = {
      id: "site-1",
      url: "http://test.com",
      concurrency_limit: 4,
    };
    expect(site.concurrency_limit).toBe(4);
    expect(site.favicon_id).toBeUndefined();
  });
});
