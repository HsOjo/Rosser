import { sha256 } from "js-sha256";

export class WSClient {
  private ws: WebSocket | null = null;
  private url = "";
  private token = "";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private isManualClose = false;

  connect(url: string, token: string) {
    this.url = url;
    this.token = token;
    this.isManualClose = false;
    this._connect();
  }

  private _connect() {
    if (this.ws) return;
    try {
      const fullUrl = `${this.url}?token=${encodeURIComponent(sha256(this.token))}`;
      this.ws = new WebSocket(fullUrl);
      this.ws.onopen = () => {
        this.emit("open", {});
      };
      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          this.emit(data.type || "message", data);
        } catch {
          this.emit("message", ev.data);
        }
      };
      this.ws.onclose = () => {
        this.ws = null;
        this.emit("close", {});
        if (!this.isManualClose) {
          this.reconnectTimer = setTimeout(() => this._connect(), 3000);
        }
      };
      this.ws.onerror = () => {
        this.emit("error", {});
      };
    } catch {
      this.reconnectTimer = setTimeout(() => this._connect(), 3000);
    }
  }

  disconnect() {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(type: string, handler: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  off(type: string, handler: (data: any) => void) {
    const arr = this.listeners.get(type);
    if (arr) {
      const idx = arr.indexOf(handler);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }

  private emit(type: string, data: any) {
    const arr = this.listeners.get(type);
    if (arr) {
      for (const h of arr) {
        try {
          h(data);
        } catch {
          // ignore
        }
      }
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export const wsClient = new WSClient();
