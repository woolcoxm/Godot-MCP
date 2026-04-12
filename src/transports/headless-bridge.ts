import { spawn, ChildProcess } from 'child_process';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export interface HeadlessOperation {
  operation: string;
  params: Record<string, any>;
}

export interface HeadlessResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class HeadlessBridge {
  private process: ChildProcess | null = null;
  private operationQueue: Array<{
    operation: HeadlessOperation;
    resolve: (result: HeadlessResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;
  private operationTimeout: number;

  constructor(operationTimeout: number = config.headlessTimeout) {
    this.operationTimeout = operationTimeout;
  }

  async execute(operation: HeadlessOperation): Promise<HeadlessResult> {
    return new Promise((resolve, reject) => {
      const queueItem = { operation, resolve, reject };
      this.operationQueue.push(queueItem);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const queueItem = this.operationQueue.shift()!;

    try {
      const result = await this.executeOperation(queueItem.operation);
      queueItem.resolve(result);
    } catch (error) {
      queueItem.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  private async executeOperation(operation: HeadlessOperation): Promise<HeadlessResult> {
    if (!this.process || this.process.killed) {
      await this.startProcess();
    }

    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Godot process not available'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timeout after ${this.operationTimeout}ms`));
        this.cleanupProcess();
      }, this.operationTimeout);

      const operationData = JSON.stringify(operation);
      
      this.process.stdin!.write(operationData + '\n');
      logger.debug(`Sent operation to Godot: ${operation.operation}`);

      const onStdout = (data: Buffer) => {
        try {
          const output = data.toString().trim();
          if (!output) return;

          const lines = output.split('\n');
          for (const line of lines) {
            if (line.startsWith('RESULT:')) {
              const resultJson = line.substring(7).trim();
              const result = JSON.parse(resultJson) as HeadlessResult;
              
              clearTimeout(timeoutId);
              this.process!.stdout!.off('data', onStdout);
              this.process!.stderr!.off('data', onStderr);
              
              resolve(result);
              return;
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          this.process!.stdout!.off('data', onStdout);
          this.process!.stderr!.off('data', onStderr);
          reject(new Error(`Failed to parse Godot output: ${error}`));
        }
      };

      const onStderr = (data: Buffer) => {
        const error = data.toString().trim();
        if (error) {
          logger.warn(`Godot stderr: ${error}`);
        }
      };

      this.process.stdout!.on('data', onStdout);
      this.process.stderr!.on('data', onStderr);
    });
  }

  private async startProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      // In a real implementation, we would need to get the absolute path to the GDScript file
      // For now, we'll assume it's in the same directory structure
      const scriptPath = 'src/godot/headless/godot_operations.gd';
      
      logger.debug(`Starting Godot headless process: ${config.godotPath} --headless --script ${scriptPath}`);
      
      this.process = spawn(config.godotPath, ['--headless', '--script', scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.on('error', (error) => {
        logger.error('Failed to start Godot process:', error);
        reject(error);
      });

      this.process.on('exit', (code, signal) => {
        logger.debug(`Godot process exited with code ${code}, signal ${signal}`);
        this.process = null;
        
        if (this.operationQueue.length > 0) {
          this.processQueue();
        }
      });

      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  private cleanupProcess(): void {
    if (this.process && !this.process.killed) {
      this.process.kill();
      this.process = null;
    }
  }

  async shutdown(): Promise<void> {
    this.operationQueue = [];
    
    if (this.process && !this.process.killed) {
      this.process.kill();
      this.process = null;
    }
    
    logger.debug('Headless bridge shutdown');
  }
}