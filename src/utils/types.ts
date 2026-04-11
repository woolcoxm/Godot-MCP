export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: GodotResult;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface GodotResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GodotNodeInfo {
  path: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
  child_count: number;
  children?: GodotNodeInfo[];
}

export interface SceneTreeNode {
  name: string;
  type: string;
  path: string;
  children: SceneTreeNode[];
}
