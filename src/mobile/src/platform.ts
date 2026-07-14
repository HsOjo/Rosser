export interface ServerConfig {
  baseURL: string;
  token: string;
}

export const SERVER_STORAGE_KEY = "rosser_server";

export function getPlatformConfig(): ServerConfig {
  const empty = { baseURL: "", token: "" };

  const raw = localStorage.getItem(SERVER_STORAGE_KEY);
  if (!raw) return empty;

  try {
    const parsed = JSON.parse(raw);
    return {
      baseURL: parsed.baseURL || "",
      token: parsed.token || "",
    };
  } catch {
    return empty;
  }
}

export function savePlatformConfig(cfg: ServerConfig) {
  localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(cfg));
}
