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

export async function getPlatformConfig(): Promise<{ baseURL: string; token: string }> {
  const raw = localStorage.getItem("rosser_config");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        baseURL: parsed.baseURL || "",
        token: parsed.token || "",
      };
    } catch {
      return { baseURL: "", token: "" };
    }
  }
  return { baseURL: "", token: "" };
}

export function savePlatformConfig(cfg: { baseURL: string; token: string }) {
  localStorage.setItem("rosser_config", JSON.stringify(cfg));
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
