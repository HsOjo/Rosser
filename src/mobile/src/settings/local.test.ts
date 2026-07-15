import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  UI_STORAGE_KEY,
  uiSettings,
  saveUISettings,
  applyUISettings,
  resetUISettings,
  getEffectiveTheme,
  parseUISettings,
} from "./local";

describe("local UI settings", () => {
  beforeEach(() => {
    resetUISettings();
    localStorage.clear();
  });

  it("returns defaults initially", () => {
    expect(uiSettings.value.theme).toBe("auto");
    expect(uiSettings.value.locale).toBe("zh-CN");
    expect(uiSettings.value.disableAnimations).toBe(false);
  });

  it("saves and loads ui settings to localStorage", () => {
    saveUISettings({ theme: "dark", locale: "en", disableAnimations: true });
    expect(localStorage.getItem(UI_STORAGE_KEY)).toBe(
      JSON.stringify({ theme: "dark", locale: "en", disableAnimations: true })
    );
  });

  it("validates invalid theme to default", () => {
    const parsed = parseUISettings(JSON.stringify({ theme: "neon" }));
    expect(parsed.theme).toBe("auto");
  });

  it("applies effective theme class", () => {
    saveUISettings({ theme: "dark" });
    applyUISettings();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("returns effective theme based on system preference", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as any;
    expect(getEffectiveTheme("auto")).toBe("dark");
  });
});
