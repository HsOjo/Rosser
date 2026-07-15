import { ref, type Ref } from "vue";

export const UI_STORAGE_KEY = "rosser_ui";

export type Theme = "light" | "dark" | "auto";

export interface UISettings {
  theme: Theme;
  locale: string;
  disableAnimations: boolean;
}

const defaults: UISettings = {
  theme: "auto",
  locale: "zh-CN",
  disableAnimations: false,
};

export function parseUISettings(raw: string | null): UISettings {
  if (!raw) return { ...defaults };
  try {
    const parsed = JSON.parse(raw);
    return {
      theme: (["light", "dark", "auto"] as Theme[]).includes(parsed.theme)
        ? parsed.theme
        : defaults.theme,
      locale: parsed.locale || defaults.locale,
      disableAnimations: typeof parsed.disableAnimations === "boolean"
        ? parsed.disableAnimations
        : defaults.disableAnimations,
    };
  } catch {
    return { ...defaults };
  }
}

function loadUISettings(): UISettings {
  if (typeof window === "undefined") return { ...defaults };
  return parseUISettings(localStorage.getItem(UI_STORAGE_KEY));
}

const uiState = ref<UISettings>(loadUISettings());

export const uiSettings = uiState;

export function getUISettings(): Ref<UISettings> {
  return uiState;
}

export function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveUISettings(settings: Partial<UISettings>) {
  uiState.value = { ...uiState.value, ...settings };
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState.value));
}

export function applyUISettings() {
  if (typeof document === "undefined") return;
  const effective = getEffectiveTheme(uiState.value.theme);
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  html.classList.add(effective);
}

export function hasUISettings(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(UI_STORAGE_KEY) !== null;
}

export function resetUISettings() {
  uiState.value = { ...defaults };
  if (typeof window !== "undefined") {
    localStorage.removeItem(UI_STORAGE_KEY);
  }
}
