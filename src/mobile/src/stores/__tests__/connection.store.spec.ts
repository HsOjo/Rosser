import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useConnectionStore } from "../index";

describe("useConnectionStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("should init from localStorage", () => {
    localStorage.setItem("rosser_config", JSON.stringify({ baseURL: "http://test", token: "tk" }));
    const store = useConnectionStore();
    store.init();
    expect(store.baseURL).toBe("http://test");
    expect(store.token).toBe("tk");
    expect(store.isReady).toBe(true);
  });

  it("should connect and persist", () => {
    const store = useConnectionStore();
    store.connect("http://srv", "abc");
    expect(store.isReady).toBe(true);
    const raw = localStorage.getItem("rosser_config");
    expect(JSON.parse(raw!)).toEqual({ baseURL: "http://srv", token: "abc" });
  });

  it("should disconnect and clear", () => {
    const store = useConnectionStore();
    store.connect("http://srv", "abc");
    store.disconnect();
    expect(store.isReady).toBe(false);
    expect(store.baseURL).toBe("");
  });
});
