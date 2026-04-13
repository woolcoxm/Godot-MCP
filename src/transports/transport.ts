import { HeadlessBridge } from './headless-bridge.js';
import { EditorBridge } from './editor-bridge.js';
import { RuntimeBridge } from './runtime-bridge.js';
import { TransportRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';

export interface TransportOperation {
  operation?: string;
  params?: Record<string, any>;
  type?: string;
  data?: any;
}

export interface TransportResult {
  success: boolean;
  data?: any;
  error?: string;
}

export enum TransportMode {
  HEADLESS = 'headless',
  EDITOR = 'editor',
  RUNTIME = 'runtime'
}

export interface TransportOptions {
  mode?: TransportMode;
  editorHost?: string;
  editorPort?: number;
  runtimeHost?: string;
  runtimePort?: number;
  headlessTimeout?: number;
}

export class Transport {
  private mode: TransportMode;
  private headlessBridge: HeadlessBridge | null = null;
  private editorBridge: EditorBridge | null = null;
  private runtimeBridge: RuntimeBridge | null = null;
  private options: TransportOptions;

  constructor(options: TransportOptions = {}) {
    this.mode = options.mode || TransportMode.HEADLESS;
    this.options = options;
    
    this.initializeBridges();
  }

  private initializeBridges(): void {
    switch (this.mode) {
      case TransportMode.HEADLESS:
        this.headlessBridge = new HeadlessBridge(this.options.headlessTimeout);
        break;
      
      case TransportMode.EDITOR:
        this.editorBridge = new EditorBridge({
          host: this.options.editorHost,
          port: this.options.editorPort
        });
        break;
      
      case TransportMode.RUNTIME:
        this.runtimeBridge = new RuntimeBridge(
          `ws://${this.options.runtimeHost || 'localhost'}:${this.options.runtimePort || 13338}`
        );
        break;
    }
  }

  async connect(): Promise<boolean> {
    switch (this.mode) {
      case TransportMode.HEADLESS:
        // Headless bridge doesn't need explicit connection
        return true;
      
      case TransportMode.EDITOR:
        if (this.editorBridge) {
          return this.editorBridge.connect();
        }
        break;
      
      case TransportMode.RUNTIME:
        if (this.runtimeBridge) {
          return this.runtimeBridge.connect();
        }
        break;
    }
    
    return false;
  }

  disconnect(): void {
    switch (this.mode) {
      case TransportMode.EDITOR:
        if (this.editorBridge) {
          this.editorBridge.disconnect();
        }
        break;
      
      case TransportMode.RUNTIME:
        if (this.runtimeBridge) {
          this.runtimeBridge.disconnect();
        }
        break;
    }
  }

  async execute(operation: TransportOperation): Promise<TransportResult> {
    // Convert operation to appropriate format for each bridge
    const formattedOperation = this.formatOperation(operation);
    
    try {
      return await TransportRetry.executeTransportOperation(
        async () => {
          switch (this.mode) {
            case TransportMode.HEADLESS:
              if (this.headlessBridge) {
                return this.headlessBridge.execute(formattedOperation);
              }
              throw new Error('Headless bridge not available');
            
            case TransportMode.EDITOR:
              if (this.editorBridge) {
                const result = await this.editorBridge.execute({
                  operation: formattedOperation.operation,
                  params: formattedOperation.params
                });
                return {
                  success: result.success,
                  data: result.data,
                  error: result.error
                };
              }
              throw new Error('Editor bridge not available');
            
            case TransportMode.RUNTIME:
              if (this.runtimeBridge) {
                const result = await this.runtimeBridge.call(
                  formattedOperation.operation,
                  formattedOperation.params
                );
                return {
                  success: true,
                  data: result
                };
              }
              throw new Error('Runtime bridge not available');
            
            default:
              throw new Error(`Unknown transport mode: ${this.mode}`);
          }
        },
        operation.operation || '',
        {
          maxAttempts: this.mode === TransportMode.HEADLESS ? 3 : 2,
          initialDelay: this.mode === TransportMode.HEADLESS ? 500 : 1000
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private formatOperation(operation: TransportOperation): any {
    // Convert operation to appropriate format for each bridge
    // This handles differences between headless and editor/runtime bridges
    
    const op = operation.operation;
    const params = operation.params || {};
    
    // Some operations need different parameter names or formats
    switch (op) {
      case 'read_scene':
        return {
          operation: 'get_scene_tree',
          params: { scene_path: params.path }
        };
      
      case 'create_node':
        return {
          operation: 'create_node',
          params: {
            parent_path: params.parentPath || '.',
            node_type: params.nodeType,
            name: params.name,
            properties: params.properties || {}
          }
        };
      
      case 'modify_node':
        return {
          operation: 'modify_node',
          params: {
            node_path: params.nodePath,
            properties: params.properties || {}
          }
        };
      
      case 'delete_node':
        return {
          operation: 'delete_node',
          params: { node_path: params.nodePath }
        };
      
      case 'read_script':
        return {
          operation: 'read_script',
          params: { script_path: params.path }
        };
      
      case 'write_script':
        return {
          operation: 'write_script',
          params: {
            script_path: params.path,
            content: params.content
          }
        };
      
      // Runtime-specific operations
      case 'eval_gdscript':
        return {
          operation: 'eval_gdscript',
          params: {
            code: params.code,
            method: params.method,
            args: params.args,
            capture_output: params.captureOutput
          }
        };
      
      case 'simulate_input':
        return {
          operation: 'simulate_input',
          params: { events: params.events }
        };
      
      case 'take_screenshot':
        return {
          operation: 'take_screenshot',
          params: { path: params.path }
        };
      
      case 'get_debug_info':
        return {
          operation: 'get_debug_info',
          params: {
            include_nodes: params.includeNodes,
            include_resources: params.includeResources
          }
        };
      
      case 'set_game_state':
        return {
          operation: 'set_game_state',
          params: {
            time_scale: params.timeScale,
            paused: params.paused
          }
        };
      
      case 'get_node_info':
        return {
          operation: 'get_node_info',
          params: { path: params.path }
        };
      
      case 'call_node_method':
        return {
          operation: 'call_node_method',
          params: {
            path: params.path,
            method: params.method,
            args: params.args
          }
        };
      
      case 'get_global_vars':
        return {
          operation: 'get_global_vars',
          params: {}
        };
      
      case 'get_signal_connections':
        return {
          operation: 'get_signal_connections',
          params: { path: params.path }
        };
      
      default:
        // For operations that have the same format
        return {
          operation: op,
          params: params
        };
    }
  }

  getMode(): TransportMode {
    return this.mode;
  }

  setMode(mode: TransportMode): void {
    if (this.mode !== mode) {
      this.disconnect();
      this.mode = mode;
      this.initializeBridges();
    }
  }

  isConnected(): boolean {
    switch (this.mode) {
      case TransportMode.HEADLESS:
        return true; // Headless is always "connected" (spawns process when needed)
      
      case TransportMode.EDITOR:
        return this.editorBridge?.isConnectedToEditor() || false;
      
      case TransportMode.RUNTIME:
        return this.runtimeBridge?.isConnected() || false;
      
      default:
        return false;
    }
  }

  static async autoDetect(options: TransportOptions = {}): Promise<Transport> {
    const runtimeBridge = new RuntimeBridge(
      `ws://${options.runtimeHost || 'localhost'}:${options.runtimePort || 13338}`
    );
    
    try {
      const runtimeConnected = await Promise.race([
        runtimeBridge.connect({ probeOnly: true }),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))
      ]);
      if (runtimeConnected) {
        logger.info('Auto-detected: Runtime mode');
        return new Transport({ ...options, mode: TransportMode.RUNTIME });
      }
    } catch (error) {
      logger.debug('Runtime not available:', error instanceof Error ? error.message : String(error));
    }
    
    const editorBridge = new EditorBridge({
      host: options.editorHost,
      port: options.editorPort
    });
    
    try {
      const editorConnected = await Promise.race([
        editorBridge.connect(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))
      ]);
      if (editorConnected) {
        logger.info('Auto-detected: Editor mode');
        return new Transport({ ...options, mode: TransportMode.EDITOR });
      }
    } catch (error) {
      logger.debug('Editor not available:', error instanceof Error ? error.message : String(error));
    }
    
    logger.info('Auto-detected: Headless mode');
    return new Transport({ ...options, mode: TransportMode.HEADLESS });
  }
}