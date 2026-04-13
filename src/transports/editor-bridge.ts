
import { WebSocket } from 'ws';
import { logger } from '../utils/logger.js';

export interface EditorBridgeOptions {
  host?: string;
  port?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface EditorOperation {
  operation: string;
  params?: Record<string, any>;
  id?: string;
}

export interface EditorResult {
  success: boolean;
  data?: any;
  error?: string;
  id?: string;
}

export class EditorBridge {
  private ws: WebSocket | null = null;
  private host: string;
  private port: number;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private isConnected = false;
  private messageQueue: Array<{operation: EditorOperation, resolve: (value: any) => void, reject: (error: any) => void}> = [];
  private messageIdCounter = 0;
  private pendingMessages = new Map<string, {resolve: (value: any) => void, reject: (error: any) => void}>();

  constructor(options: EditorBridgeOptions = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 13337;
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const url = `ws://${this.host}:${this.port}`;
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          logger.debug(`[EditorBridge] Connected to editor at ${url}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          resolve(true);
        };
        
        this.ws.onclose = (event) => {
          logger.debug(`[EditorBridge] Connection closed: ${event.code} ${event.reason}`);
          this.isConnected = false;
          this.handleDisconnection();
          resolve(false);
        };
        
        this.ws.onerror = (error) => {
          logger.debug('[EditorBridge] WebSocket error:', error.message || error);
          this.isConnected = false;
          resolve(false);
        };
        
        this.ws.onmessage = (event) => {
          let rawData: string;
          if (Buffer.isBuffer(event.data)) {
            rawData = event.data.toString('utf8');
          } else if (typeof event.data === 'string') {
            rawData = event.data;
          } else {
            rawData = Buffer.from(event.data as ArrayBuffer).toString('utf8');
          }
          this.handleMessage(rawData);
        };
      } catch (error) {
        logger.debug('[EditorBridge] Failed to create WebSocket:', error instanceof Error ? error.message : String(error));
        resolve(false);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.pendingMessages.clear();
    this.messageQueue = [];
  }

  isConnectedToEditor(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  async execute(operation: EditorOperation): Promise<EditorResult> {
    return new Promise((resolve, reject) => {
      const messageId = (++this.messageIdCounter).toString();
      const message = {
        ...operation,
        id: messageId
      };

      this.pendingMessages.set(messageId, { resolve, reject });

      if (this.isConnectedToEditor()) {
        this.sendMessage(message);
      } else {
        this.messageQueue.push({ operation: message, resolve, reject });
        if (this.reconnectAttempts === 0) {
          this.connect();
        }
      }
    });
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
          logger.error('[EditorBridge] Cannot send message, WebSocket not open');
      const pending = this.pendingMessages.get(message.id);
      if (pending) {
        pending.reject(new Error('WebSocket not connected'));
        this.pendingMessages.delete(message.id);
      }
    }
  }

  private handleMessage(data: string): void {
    try {
      const result: EditorResult = JSON.parse(data);
      
      if (result.id && this.pendingMessages.has(result.id)) {
        const pending = this.pendingMessages.get(result.id)!;
        this.pendingMessages.delete(result.id);
        
        if (result.success) {
          pending.resolve(result);
        } else {
          pending.reject(new Error(result.error || 'Unknown error'));
        }
      } else {
        logger.warn('[EditorBridge] Received message without ID or unknown ID:', result);
      }
    } catch (error) {
        logger.error('[EditorBridge] Failed to parse message:', error instanceof Error ? error.message : String(error));
    }
  }

  private flushMessageQueue(): void {
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const item of queue) {
      this.pendingMessages.set(item.operation.id!, { resolve: item.resolve, reject: item.reject });
      this.sendMessage(item.operation);
    }
  }

  private handleDisconnection(): void {
    // Reject all pending messages
    for (const [, pending] of this.pendingMessages) {
      pending.reject(new Error('Connection lost'));
    }
    this.pendingMessages.clear();
    
    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.debug(`[EditorBridge] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      logger.error('[EditorBridge] Max reconnection attempts reached');
    }
  }

  // Convenience methods for common operations
  async ping(): Promise<EditorResult> {
    return this.execute({ operation: 'ping' });
  }

  async getEditorInfo(): Promise<EditorResult> {
    return this.execute({ operation: 'get_editor_info' });
  }

  async getCurrentScene(): Promise<EditorResult> {
    return this.execute({ operation: 'get_current_scene' });
  }

  async getSceneTree(scenePath?: string): Promise<EditorResult> {
    return this.execute({ 
      operation: 'get_scene_tree',
      params: scenePath ? { scene_path: scenePath } : {}
    });
  }

  async getNodeProperties(nodePath: string): Promise<EditorResult> {
    return this.execute({
      operation: 'get_node_properties',
      params: { node_path: nodePath }
    });
  }

  async createNode(parentPath: string, nodeType: string, name: string, properties: Record<string, any> = {}): Promise<EditorResult> {
    return this.execute({
      operation: 'create_node',
      params: {
        parent_path: parentPath,
        node_type: nodeType,
        name: name,
        properties: properties
      }
    });
  }

  async modifyNode(nodePath: string, properties: Record<string, any>): Promise<EditorResult> {
    return this.execute({
      operation: 'modify_node',
      params: {
        node_path: nodePath,
        properties: properties
      }
    });
  }

  async deleteNode(nodePath: string): Promise<EditorResult> {
    return this.execute({
      operation: 'delete_node',
      params: { node_path: nodePath }
    });
  }

  async readScript(scriptPath: string): Promise<EditorResult> {
    return this.execute({
      operation: 'read_script',
      params: { script_path: scriptPath }
    });
  }

  async writeScript(scriptPath: string, content: string): Promise<EditorResult> {
    return this.execute({
      operation: 'write_script',
      params: {
        script_path: scriptPath,
        content: content
      }
    });
  }

  async listTools(): Promise<EditorResult> {
    return this.execute({ operation: 'list_tools' });
  }
}