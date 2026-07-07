let _isTauriCache: boolean | null = null;

export async function detectTauri(): Promise<boolean> {
  if (_isTauriCache !== null) return _isTauriCache;
  try {
    await import("@tauri-apps/api/core");
    _isTauriCache = true;
  } catch {
    _isTauriCache = false;
  }
  return _isTauriCache;
}

export function isTauri(): boolean {
  return _isTauriCache ?? false;
}

export async function getPlatformConfig(): Promise<{ baseURL: string; token: string }> {
  if (await detectTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("get_backend_config");
    } catch {
      // fallback
    }
  }
  const raw = localStorage.getItem("rosser_config");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return { baseURL: "", token: "" };
    }
  }
  return { baseURL: "", token: "" };
}

export function savePlatformConfig(cfg: { baseURL: string; token: string }) {
  localStorage.setItem("rosser_config", JSON.stringify(cfg));
}

export async function openExternal(url: string) {
  if (await detectTauri()) {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } else {
    window.open(url, "_blank");
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
