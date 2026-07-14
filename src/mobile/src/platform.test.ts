import { describe, it, expect, beforeEach } from "vitest";
import {
  SERVER_STORAGE_KEY,
  getPlatformConfig,
  savePlatformConfig,
  type ServerConfig,
} from "./platform";

describe("platform server config", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty config when localStorage is empty", () => {
    const cfg = getPlatformConfig();
    expect(cfg).toEqual({ baseURL: "", token: "" });
  });

  it("round-trips config through localStorage", () => {
    const input: ServerConfig = {
      baseURL: "http://localhost:8000",
      token: "my-token",
    };
    savePlatformConfig(input);
    expect(localStorage.getItem(SERVER_STORAGE_KEY)).toBe(JSON.stringify(input));
    expect(getPlatformConfig()).toEqual(input);
  });

  it("ignores extra fields from frontend config", () => {
    localStorage.setItem(
      SERVER_STORAGE_KEY,
      JSON.stringify({ baseURL: "http://x", token: "t", isBuiltIn: true })
    );
    expect(getPlatformConfig()).toEqual({ baseURL: "http://x", token: "t" });
  });

  it("returns empty config for invalid JSON", () => {
    localStorage.setItem(SERVER_STORAGE_KEY, "not-json");
    expect(getPlatformConfig()).toEqual({ baseURL: "", token: "" });
    expect(localStorage.getItem(SERVER_STORAGE_KEY)).toBe("not-json");
  });
});
