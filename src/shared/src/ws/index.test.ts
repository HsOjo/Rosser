import { describe, it, expect, vi, beforeEach } from "vitest";
import { sha256 } from "js-sha256";
import { WSClient } from "./index.js";

// Minimal WebSocket mock
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  onopen: ((ev?: any) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: ((ev?: any) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.closed = true;
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }

  static reset() {
    MockWebSocket.instances = [];
  }
}

vi.stubGlobal("WebSocket", MockWebSocket);

describe("WSClient", () => {
  beforeEach(() => {
    MockWebSocket.reset();
    vi.useFakeTimers();
  });

  it("connects with token hash in query string", () => {
    const ws = new WSClient();
    ws.connect("ws://localhost:8000/ws", "my-token");
    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toContain(`token=${sha256("my-token")}`);
  });

  it("emits open event", () => {
    const ws = new WSClient();
    const handler = vi.fn();
    ws.on("open", handler);
    ws.connect("ws://localhost/ws", "t");
    MockWebSocket.instances[0].onopen!();
    expect(handler).toHaveBeenCalledOnce();
  });

  it("parses and emits typed messages", () => {
    const ws = new WSClient();
    const handler = vi.fn();
    ws.on("articles.new", handler);
    ws.connect("ws://localhost/ws", "t");
    MockWebSocket.instances[0].onmessage!({ data: JSON.stringify({ type: "articles.new", count: 3 }) });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: "articles.new", count: 3 }));
  });

  it("reconnects on close", () => {
    const ws = new WSClient();
    ws.connect("ws://localhost/ws", "t");
    MockWebSocket.instances[0].onclose!();
    expect(MockWebSocket.instances.length).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(MockWebSocket.instances.length).toBe(2);
  });

  it("does not reconnect after manual disconnect", () => {
    const ws = new WSClient();
    ws.connect("ws://localhost/ws", "t");
    ws.disconnect();
    expect(MockWebSocket.instances[0].closed).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(MockWebSocket.instances.length).toBe(1);
  });

  it("send serializes data when open", () => {
    const ws = new WSClient();
    ws.connect("ws://localhost/ws", "t");
    MockWebSocket.instances[0].onopen!();
    ws.send({ action: "ping" });
    expect(MockWebSocket.instances[0].sent[0]).toBe('{"action":"ping"}');
  });
});
