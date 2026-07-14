import { sha256 } from "js-sha256";

export function normalizeBaseURL(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function signFileUrl(fileId: string, exp: number, secret: string): Promise<string> {
  const msg = `${fileId}|${exp}`;
  return sha256.hmac(secret, msg).slice(0, 32);
}

export async function buildFileUrl(fileId: string, baseURL: string, token: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const sig = await signFileUrl(fileId, exp, token);
  return `${normalizeBaseURL(baseURL)}/api/files/${fileId}/download?exp=${exp}&sig=${sig}`;
}

export async function resolveFilePlaceholders(
  html: string | null | undefined,
  baseURL: string,
  token: string
): Promise<string> {
  if (!html) return "";
  const base = normalizeBaseURL(baseURL);
  const matches = Array.from(html.matchAll(/\$file@([a-f0-9-]+)/g));
  let result = html;
  for (const match of matches) {
    const fileId = match[1];
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const sig = await signFileUrl(fileId, exp, token);
    const url = `${base}/api/files/${fileId}/download?exp=${exp}&sig=${sig}`;
    result = result.replace(match[0], url);
  }
  return result;
}

export function encodeCredentials(baseURL: string, token: string): string {
  const payload = JSON.stringify({ b: normalizeBaseURL(baseURL), t: token });
  return btoa(payload);
}

export function decodeCredentials(encoded: string): { baseURL: string; token: string } | null {
  try {
    const payload = atob(encoded);
    const parsed = JSON.parse(payload);
    return { baseURL: parsed.b, token: parsed.t };
  } catch {
    return null;
  }
}

export function formatTime(iso: string | null | undefined, locale = "zh-CN"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string | null | undefined, locale = "zh-CN"): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale.startsWith("zh")) {
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 30) return `${days} 天前`;
    return formatTime(iso, locale);
  }

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatTime(iso, locale);
}
