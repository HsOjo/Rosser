let _isTauri = false;

try {
  const { invoke } = await import("@tauri-apps/api/core");
  _isTauri = true;
} catch {
  _isTauri = false;
}

export const isTauri = () => _isTauri;

export async function getPlatformConfig(): Promise<{ baseURL: string; token: string }> {
  if (_isTauri) {
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
  if (_isTauri) {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } else {
    window.open(url, "_blank");
  }
}

export async function sendNotification(title: string, body: string) {
  if (_isTauri) {
    try {
      const { sendNotification: notify } = await import("@tauri-apps/plugin-notification");
      notify({ title, body });
    } catch {
      // ignore
    }
  }
}
