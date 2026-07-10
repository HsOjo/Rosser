function isTauriEnv(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!(w.__TAURI__ || w.__TAURI_INTERNALS__ || w.__TAURI_METADATA__);
}

let _isTauriCache: boolean | null = isTauriEnv() ? true : null;

export async function detectTauri(): Promise<boolean> {
  if (_isTauriCache !== null) return _isTauriCache;
  _isTauriCache = isTauriEnv();
  return _isTauriCache;
}

export function isTauri(): boolean {
  return _isTauriCache ?? false;
}

export interface ServerConfig {
  baseURL: string;
  token: string;
  isBuiltIn?: boolean;
}

const SERVER_STORAGE_KEY = "rosser_server";
const LEGACY_CONFIG_KEY = "rosser_config";
const OLD_BUILTIN_URL = "http://127.0.0.1:8000";
const OLD_BUILTIN_TOKEN = "dev-token-change-me";

function isStaleBuiltInConfig(parsed: any): boolean {
  // Built-in server ports are dynamically assigned each launch, so any saved
  // built-in config (including the old fixed-port one) is stale.
  if (parsed.isBuiltIn === true) return true;
  if (parsed.baseURL === OLD_BUILTIN_URL && parsed.token === OLD_BUILTIN_TOKEN) {
    return true;
  }
  return false;
}

export async function getPlatformConfig(): Promise<ServerConfig> {
  const empty = { baseURL: "", token: "", isBuiltIn: false };

  const migrate = (parsed: any): ServerConfig | null => {
    if (isStaleBuiltInConfig(parsed)) return null;
    return {
      baseURL: parsed.baseURL || "",
      token: parsed.token || "",
      isBuiltIn: parsed.isBuiltIn ?? false,
    };
  };

  const raw = localStorage.getItem(SERVER_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const cfg = migrate(parsed);
      if (cfg === null) {
        localStorage.removeItem(SERVER_STORAGE_KEY);
        return empty;
      }
      return cfg;
    } catch {
      return empty;
    }
  }

  // Migrate legacy config key if present.
  const legacy = localStorage.getItem(LEGACY_CONFIG_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      const cfg = migrate(parsed);
      localStorage.removeItem(LEGACY_CONFIG_KEY);
      if (cfg === null) {
        return empty;
      }
      localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(cfg));
      return cfg;
    } catch {
      localStorage.removeItem(LEGACY_CONFIG_KEY);
    }
  }

  return empty;
}

export function savePlatformConfig(cfg: ServerConfig) {
  localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(cfg));
}

import { ref, type Ref } from "vue";

const UI_STORAGE_KEY = "rosser_ui";

type UISettings = {
  theme: string;
  locale: string;
};

const defaults: UISettings = { theme: "auto", locale: "zh-CN" };

function loadUISettings(): UISettings {
  if (typeof window === "undefined") return { ...defaults };
  const raw = localStorage.getItem(UI_STORAGE_KEY);
  if (!raw) return { ...defaults };
  try {
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme || defaults.theme,
      locale: parsed.locale || defaults.locale,
    };
  } catch {
    return { ...defaults };
  }
}

const uiState = ref<UISettings>(loadUISettings());

export const uiSettings = uiState;

export function getUISettings(): Ref<UISettings> {
  return uiState;
}

export function saveUISettings(settings: Partial<UISettings>) {
  uiState.value = { ...uiState.value, ...settings };
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState.value));
}

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as any).userAgentData;
  if (uaData?.platform) {
    return /macOS|Mac/i.test(uaData.platform);
  }
  return (
    /Mac/i.test(navigator.platform || "") ||
    /Mac OS X|macOS/i.test(navigator.userAgent || "")
  );
}

export function needsMacTitleInset(): boolean {
  return isTauri() && isMac();
}

export async function openExternal(url: string) {
  if (await detectTauri()) {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } else {
    window.open(url, "_blank");
  }
}

let _windowApi: any = null;

async function getWindowApi() {
  if (_windowApi) return _windowApi;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  _windowApi = getCurrentWindow();
  return _windowApi;
}

export async function startDraggingWindow() {
  if (await detectTauri()) {
    const win = await getWindowApi();
    await win.startDragging();
  }
}

export async function sendNotification(title: string, body: string) {
  if (await detectTauri()) {
    try {
      const { sendNotification: notify } = await import("@tauri-apps/plugin-notification");
      notify({ title, body });
    } catch {
      // ignore
    }
  }
}

import type { Menu, Submenu } from "@tauri-apps/api/menu";

let _menuSetupDone = false;

export async function setupAppMenu(reloadText: string) {
  if (_menuSetupDone || !(await detectTauri())) return;
  _menuSetupDone = true;

  const { Menu, Submenu, MenuItem } = await import("@tauri-apps/api/menu");
  const menu = await Menu.default();

  if (await menu.get("reload")) {
    return;
  }

  const viewMenu = await findOrCreateViewSubmenu(menu, Submenu);
  const accelerator = isMac() ? "Cmd+R" : "Ctrl+R";
  const reloadItem = await MenuItem.new({
    id: "reload",
    text: reloadText,
    accelerator,
    action: () => {
      window.location.reload();
    },
  });

  await viewMenu.append(reloadItem);
  await menu.setAsAppMenu();
}

async function findOrCreateViewSubmenu(
  menu: Menu,
  Submenu: typeof import("@tauri-apps/api/menu").Submenu
): Promise<Submenu> {
  const items = await menu.items();
  for (const item of items) {
    if (item.kind === "Submenu") {
      const text = await (item as Submenu).text();
      if (text === "View" || text === "视图") {
        return item as Submenu;
      }
    }
  }
  return await Submenu.new({ text: "View" });
}
