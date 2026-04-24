import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { connectionPool } from '../utils/connection-pool.js';
import { isValidExecutable } from '../utils/security.js';

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
  private operationTimeout: number;

  constructor(operationTimeout: number = config.headlessTimeout) {
    this.operationTimeout = operationTimeout;
  }

  async execute(operation: HeadlessOperation): Promise<HeadlessResult> {
    try {
      // Use connection pool to manage Godot processes
      const { connection: process, release } = await connectionPool.acquire(
        'godot_process',
        async () => {
          return this.spawnGodotProcess();
        }
      );
      
      try {
        const result = await this.executeWithProcess(process as ChildProcess, operation);
        release();
        return result;
      } catch (error) {
        release();
        throw error;
      }
    } catch (error) {
      logger.error('Headless bridge execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private spawnGodotProcess(): ChildProcess {
    const godotPath = config.godotPath;

    if (!isValidExecutable(godotPath)) {
      throw new Error(`Security Error: Blocked execution of potentially dangerous executable: ${godotPath}`);
    }

    const scriptPath = path.join(__dirname, '../../godot/headless/godot_operations.gd');
    
    logger.debug(`Spawning Godot process: ${godotPath} --headless --script ${scriptPath}`);
    
    const process = spawn(godotPath, ['--headless', '--script', scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Set up basic error handling
    process.on('error', (error) => {
      logger.error(`Godot process error: ${error.message}`);
    });
    
    process.on('close', (code) => {
      logger.debug(`Godot process closed with code ${code}`);
    });
    
    return process;
  }

  private executeWithProcess(process: ChildProcess, operation: HeadlessOperation): Promise<HeadlessResult> {
    return new Promise((resolve, reject) => {
      if (process.killed) {
        reject(new Error('Godot process has been killed'));
        return;
      }

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Operation timeout after ${this.operationTimeout}ms`));
      }, this.operationTimeout);

      const operationData = JSON.stringify(operation);
      
      // Set up response handler
      const onStdout = (data: Buffer) => {
        try {
          const output = data.toString().trim();
          if (!output) return;

          const lines = output.split('\n');
          for (const line of lines) {
            if (line.startsWith('RESULT:')) {
              const resultJson = line.substring(7).trim();
              try {
                const result = JSON.parse(resultJson);
                cleanup();
                resolve(result);
              } catch (parseError) {
                cleanup();
                reject(new Error(`Failed to parse result JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
              }
              return;
            } else if (line.startsWith('ERROR:')) {
              const errorMsg = line.substring(6).trim();
              cleanup();
              reject(new Error(`Godot error: ${errorMsg}`));
              return;
            }
          }
        } catch (error) {
          cleanup();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      const onStderr = (data: Buffer) => {
        const error = data.toString().trim();
        if (error) {
          logger.warn(`Godot stderr: ${error}`);
        }
      };

      const onError = (error: Error) => {
        cleanup();
        reject(new Error(`Process error: ${error.message}`));
      };

      const onClose = (code: number | null) => {
        cleanup();
        if (code !== 0 && code !== null) {
          reject(new Error(`Godot process exited with code ${code}`));
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        process.stdout?.off('data', onStdout);
        process.stderr?.off('data', onStderr);
        process.off('error', onError);
        process.off('close', onClose);
      };

      // Set up listeners
      process.stdout?.on('data', onStdout);
      process.stderr?.on('data', onStderr);
      process.on('error', onError);
      process.on('close', onClose);

      // Send operation
      try {
        process.stdin?.write(operationData + '\n');
        logger.debug(`Sent operation to Godot: ${operation.operation}`);
      } catch (error) {
        cleanup();
        reject(new Error(`Failed to send operation: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
  }

  shutdown(): void {
    // The connection pool will be shutdown separately
    logger.debug('Headless bridge shutdown requested');
  }

  getPoolStats(): any {
    return connectionPool.getStats();
  }
}