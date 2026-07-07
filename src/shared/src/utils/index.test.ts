import { describe, it, expect } from "vitest";
import {
  signFileUrl,
  resolveFilePlaceholders,
  encodeCredentials,
  decodeCredentials,
  formatTime,
  relativeTime,
} from "./index.js";

describe("utils", () => {
  describe("signFileUrl", () => {
    it("returns a 32-char hex signature", async () => {
      const sig = await signFileUrl("file-id-1", 1234567890, "secret-key");
      expect(sig).toMatch(/^[a-f0-9]{32}$/);
    });

    it("produces different sigs for different inputs", async () => {
      const s1 = await signFileUrl("a", 1, "k");
      const s2 = await signFileUrl("b", 1, "k");
      expect(s1).not.toBe(s2);
    });
  });

  describe("resolveFilePlaceholders", () => {
    it("replaces $file@ placeholders with signed URLs", async () => {
      const html = '![]($file@abc123) <img src="$file@def456">';
      const result = await resolveFilePlaceholders(html, "http://localhost:8000", "token");
      expect(result).not.toContain("$file@");
      expect(result).toContain("/api/files/abc123/download?exp=");
      expect(result).toContain("/api/files/def456/download?exp=");
      expect(result).toContain("&sig=");
    });

    it("returns empty string for null/undefined", async () => {
      expect(await resolveFilePlaceholders(null, "http://x", "t")).toBe("");
      expect(await resolveFilePlaceholders(undefined, "http://x", "t")).toBe("");
    });

    it("returns original html when no placeholders", async () => {
      const html = "<p>hello</p>";
      const result = await resolveFilePlaceholders(html, "http://x", "t");
      expect(result).toBe(html);
    });
  });

  describe("encodeCredentials / decodeCredentials", () => {
    it("round-trips correctly", () => {
      const encoded = encodeCredentials("http://localhost", "my-token");
      const decoded = decodeCredentials(encoded);
      expect(decoded).toEqual({ baseURL: "http://localhost", token: "my-token" });
    });

    it("returns null for invalid input", () => {
      expect(decodeCredentials("not-valid-base64!!!")).toBeNull();
      expect(decodeCredentials(btoa("not-json"))).toBeNull();
    });
  });

  describe("formatTime", () => {
    it("formats ISO string to locale string", () => {
      const result = formatTime("2024-01-15T08:30:00Z", "zh-CN");
      expect(result).toContain("2024");
      expect(result).toContain("01");
      expect(result).toContain("15");
    });

    it("returns empty for null/undefined", () => {
      expect(formatTime(null)).toBe("");
      expect(formatTime(undefined)).toBe("");
    });

    it("returns original for invalid date", () => {
      expect(formatTime("not-a-date")).toBe("not-a-date");
    });
  });

  describe("relativeTime", () => {
    it("returns '刚刚' for very recent time", () => {
      const now = new Date().toISOString();
      expect(relativeTime(now, "zh-CN")).toBe("刚刚");
    });

    it("falls back to formatTime for old dates", () => {
      const old = "2020-01-01T00:00:00Z";
      const result = relativeTime(old, "zh-CN");
      expect(result).toContain("2020");
    });

    it("supports English locale", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(relativeTime(fiveMinAgo, "en")).toBe("5m ago");
    });

    it("returns empty for null/undefined", () => {
      expect(relativeTime(null)).toBe("");
      expect(relativeTime(undefined)).toBe("");
    });
  });
});
