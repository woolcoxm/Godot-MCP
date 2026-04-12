import { WebSocket } from 'ws';

export interface RuntimeMessage {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, any>;
}

export interface RuntimeResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export class RuntimeBridge {
  private ws: WebSocket | null = null;
  private url: string;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private messageQueue: Array<{ message: RuntimeMessage; resolve: (value: any) => void; reject: (error: Error) => void }> = [];
  private nextId: number = 1;

  constructor(url: string = 'ws://localhost:13338') {
    this.url = url;
  }

  async connect(): Promise<boolean> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('[RuntimeBridge] Connected to runtime WebSocket server');
          this._processMessageQueue();
          resolve(true);
        };

        this.ws.onclose = (event: any) => {
          this.connected = false;
          console.warn(`[RuntimeBridge] Disconnected from runtime: ${event.code} ${event.reason}`);
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
            console.log(`[RuntimeBridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
              this.connect().then(resolve);
            }, delay);
          } else {
            console.error('[RuntimeBridge] Max reconnection attempts reached');
            resolve(false);
          }
        };

        this.ws.onerror = (error: any) => {
          console.error('[RuntimeBridge] WebSocket error:', error);
        };

        this.ws.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data.toString());
            this._handleMessage(data);
          } catch (error) {
            console.error('[RuntimeBridge] Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('[RuntimeBridge] Failed to create WebSocket connection:', error);
        resolve(false);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
    this.messageQueue.forEach(({ reject }) => {
      reject(new Error('Disconnected while waiting for response'));
    });
    this.messageQueue = [];
  }

  async call(method: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.connected) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Not connected to runtime');
      }
    }

    return new Promise((resolve, reject) => {
      const message: RuntimeMessage = {
        jsonrpc: '2.0',
        id: this.nextId++,
        method,
        params
      };

      this.messageQueue.push({ message, resolve, reject });
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this._sendMessage(message);
      } else {
        console.warn('[RuntimeBridge] WebSocket not ready, queuing message');
      }
    });
  }

  private _sendMessage(message: RuntimeMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('[RuntimeBridge] Cannot send message, WebSocket not open');
    }
  }

  private _handleMessage(response: RuntimeResponse): void {
    const index = this.messageQueue.findIndex(item => item.message.id === response.id);
    
    if (index === -1) {
      console.warn(`[RuntimeBridge] Received response for unknown message id: ${response.id}`);
      return;
    }

    const { resolve, reject } = this.messageQueue[index];
    this.messageQueue.splice(index, 1);

    if (response.error) {
      reject(new Error(`Runtime error: ${response.error.message} (code: ${response.error.code})`));
    } else {
      resolve(response.result);
    }
  }

  private _processMessageQueue(): void {
    // Send all queued messages
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    queue.forEach(({ message, resolve, reject }) => {
      this.messageQueue.push({ message, resolve, reject });
      this._sendMessage(message);
    });
  }

  // Runtime-specific methods
  async getGameState(): Promise<any> {
    return this.call('get_game_state', {});
  }

  async evalGDScript(code: string, options: { method?: string; args?: any[]; captureOutput?: boolean } = {}): Promise<any> {
    return this.call('eval_gdscript', {
      code,
      method: options.method,
      args: options.args,
      capture_output: options.captureOutput
    });
  }

  async simulateInput(events: any[]): Promise<any> {
    return this.call('simulate_input', { events });
  }

  async takeScreenshot(options: { path?: string } = {}): Promise<any> {
    return this.call('take_screenshot', options);
  }

  async getDebugInfo(options: { includeNodes?: boolean; includeResources?: boolean } = {}): Promise<any> {
    return this.call('get_debug_info', options);
  }

  async setGameState(options: { timeScale?: number; paused?: boolean } = {}): Promise<any> {
    return this.call('set_game_state', options);
  }

  async getNodeInfo(path: string): Promise<any> {
    return this.call('get_node_info', { path });
  }

  async callNodeMethod(path: string, method: string, args: any[] = []): Promise<any> {
    return this.call('call_node_method', { path, method, args });
  }

  async getGlobalVars(): Promise<any> {
    return this.call('get_global_vars', {});
  }

  async getSignalConnections(path: string): Promise<any> {
    return this.call('get_signal_connections', { path });
  }

  async shutdown(): Promise<any> {
    return this.call('shutdown', {});
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}