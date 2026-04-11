import WebSocket from "ws";
import type { ConnectionState, JsonRpcRequest, JsonRpcResponse } from "./types.js";

const GODOT_WS_URL = "ws://127.0.0.1:9900";
const HEARTBEAT_INTERVAL = 5000;
const REQUEST_TIMEOUT = 15000;
const MAX_RECONNECT_DELAY = 30000;

export class GodotConnection {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: (response: JsonRpcResponse) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
  private _state: ConnectionState = "disconnected";
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private intentionalClose = false;

  get state(): ConnectionState {
    return this._state;
  }

  onStateChange?: (state: ConnectionState) => void;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.intentionalClose = false;
      this.setState("connecting");

      try {
        this.ws = new WebSocket(GODOT_WS_URL);
      } catch (err) {
        this.setState("error");
        reject(new Error(`Failed to create WebSocket: ${(err as Error).message}`));
        return;
      }

      this.ws.on("open", () => {
        this.setState("connected");
        this.startHeartbeat();
        this.reconnectDelay = 1000;
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString()) as JsonRpcResponse;
          if (response.id && this.pendingRequests.has(response.id)) {
            const pending = this.pendingRequests.get(response.id)!;
            clearTimeout(pending.timer);
            this.pendingRequests.delete(response.id);
            pending.resolve(response);
          }
        } catch {
          // ignore malformed messages
        }
      });

      this.ws.on("close", () => {
        this.stopHeartbeat();
        this.setState("disconnected");
        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      });

      this.ws.on("error", (err: Error) => {
        if (this._state === "connecting") {
          this.setState("error");
          reject(new Error(`WebSocket connection error: ${err.message}`));
        }
      });
    });
  }

  async sendRequest(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse> {
    if (this._state !== "connected" || !this.ws) {
      throw new Error("Not connected to Godot. Ensure the Godot editor is running with the godot_mcp plugin enabled.");
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };

    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request '${method}' timed out after ${REQUEST_TIMEOUT}ms`));
      }, REQUEST_TIMEOUT);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        this.ws!.send(JSON.stringify(request));
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(new Error(`Failed to send request: ${(err as Error).message}`));
      }
    });
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Connection closed"));
    }
    this.pendingRequests.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState("disconnected");
  }

  private setState(state: ConnectionState): void {
    if (this._state !== state) {
      this._state = state;
      this.onStateChange?.(state);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        // will schedule next reconnect in the close handler
      }
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }
}
