import { describe, it, expect, vi } from "vitest";
import { checkForUpdate } from "./updater.js";

vi.mock("@rosser/shared", () => ({
  api: {
    GET: vi.fn(),
  },
}));

function makeResponse(haveNew: boolean) {
  return {
    data: {
      current: "0.2.0",
      latest: "v0.2.1",
      have_new: haveNew,
      name: "v0.2.1",
      tag_name: "v0.2.1",
      published_at: "2026-01-01 00:00:00",
      html_url: "https://github.com/HsOjo/Rosser/releases/tag/v0.2.1",
      body: "release notes",
      download_url: "https://github.com/HsOjo/Rosser/releases/download/v0.2.1/Rosser.zip",
      assets: [
        { name: "Rosser.zip", url: "https://github.com/HsOjo/Rosser/releases/download/v0.2.1/Rosser.zip" },
      ],
    },
    error: undefined,
  };
}

describe("checkForUpdate", () => {
  it("returns parsed result when a newer version exists", async () => {
    const { api } = await import("@rosser/shared");
    vi.mocked(api.GET).mockResolvedValue(makeResponse(true) as any);

    const result = await checkForUpdate();
    expect(api.GET).toHaveBeenCalledWith("/api/update");
    expect(result.haveNew).toBe(true);
    expect(result.latest).toBe("v0.2.1");
    expect(result.downloadUrl).toBe("https://github.com/HsOjo/Rosser/releases/download/v0.2.1/Rosser.zip");
    expect(result.assets).toEqual([
      { name: "Rosser.zip", url: "https://github.com/HsOjo/Rosser/releases/download/v0.2.1/Rosser.zip" },
    ]);
  });

  it("returns parsed result when already up to date", async () => {
    const { api } = await import("@rosser/shared");
    vi.mocked(api.GET).mockResolvedValue(makeResponse(false) as any);

    const result = await checkForUpdate();
    expect(result.haveNew).toBe(false);
  });

  it("throws when the backend returns an error", async () => {
    const { api } = await import("@rosser/shared");
    vi.mocked(api.GET).mockResolvedValue({ data: undefined, error: { message: "network error" } } as any);

    await expect(checkForUpdate()).rejects.toEqual({ message: "network error" });
  });
});
