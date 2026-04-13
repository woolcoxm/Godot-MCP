import { logger } from './logger.js';

export interface PooledConnection {
  id: string;
  createdAt: number;
  lastUsed: number;
  connection: any;
  inUse: boolean;
}

export interface ConnectionPoolOptions {
  maxSize: number;
  maxIdleTime: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

export class ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private options: ConnectionPoolOptions;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: Partial<ConnectionPoolOptions> = {}) {
    this.options = {
      maxSize: options.maxSize || 10,
      maxIdleTime: options.maxIdleTime || 30000, // 30 seconds
      cleanupInterval: options.cleanupInterval || 10000, // 10 seconds
    };

    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.options.cleanupInterval);
  }

  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [id, conn] of this.connections.entries()) {
      if (!conn.inUse && (now - conn.lastUsed) > this.options.maxIdleTime) {
        this.connections.delete(id);
        removedCount++;
        
        // Clean up the connection if it has a close/destroy method
        if (typeof conn.connection.close === 'function') {
          conn.connection.close().catch((err: any) => {
            logger.warn(`Failed to close connection ${id}: ${err.message}`);
          });
        } else if (typeof conn.connection.destroy === 'function') {
          conn.connection.destroy();
        }
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} idle connections`);
    }
  }

  async acquire<T>(key: string, createFn: () => Promise<T>): Promise<{ connection: T; release: () => void }> {
    // Check for existing available connection
    for (const conn of this.connections.values()) {
      if (conn.id.startsWith(key) && !conn.inUse) {
        conn.inUse = true;
        conn.lastUsed = Date.now();
        logger.debug(`Reusing connection ${conn.id}`);
        return {
          connection: conn.connection as T,
          release: () => this.release(conn.id)
        };
      }
    }

    // Create new connection if pool not full
    if (this.connections.size < this.options.maxSize) {
      const connection = await createFn();
      const id = `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pooledConn: PooledConnection = {
        id,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        connection,
        inUse: true
      };

      this.connections.set(id, pooledConn);
      logger.debug(`Created new connection ${id}`);

      return {
        connection,
        release: () => this.release(id)
      };
    }

    // Wait for a connection to become available
    logger.debug(`Connection pool full for key ${key}, waiting...`);
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const conn of this.connections.values()) {
          if (conn.id.startsWith(key) && !conn.inUse) {
            clearInterval(checkInterval);
            conn.inUse = true;
            conn.lastUsed = Date.now();
            logger.debug(`Acquired connection ${conn.id} after wait`);
            resolve({
              connection: conn.connection as T,
              release: () => this.release(conn.id)
            });
            return;
          }
        }
      }, 100);
    });
  }

  private release(id: string): void {
    const conn = this.connections.get(id);
    if (conn) {
      conn.inUse = false;
      conn.lastUsed = Date.now();
      logger.debug(`Released connection ${id}`);
    }
  }

  getStats(): {
    total: number;
    inUse: number;
    idle: number;
    maxSize: number;
  } {
    let inUse = 0;
    let idle = 0;

    for (const conn of this.connections.values()) {
      if (conn.inUse) {
        inUse++;
      } else {
        idle++;
      }
    }

    return {
      total: this.connections.size,
      inUse,
      idle,
      maxSize: this.options.maxSize
    };
  }

  async closeAll(): Promise<void> {
    this.stopCleanup();

    const closePromises: Promise<void>[] = [];
    
    for (const [id, conn] of this.connections.entries()) {
      this.connections.delete(id);
      
      if (typeof conn.connection.close === 'function') {
        closePromises.push(
          conn.connection.close().catch((err: any) => {
            logger.warn(`Failed to close connection ${id}: ${err.message}`);
          })
        );
      } else if (typeof conn.connection.destroy === 'function') {
        conn.connection.destroy();
      }
    }

    await Promise.allSettled(closePromises);
    logger.info('Closed all connections in pool');
  }

  destroy(): void {
    this.stopCleanup();
    this.closeAll().catch(err => {
      logger.error(`Error closing connections: ${err.message}`);
    });
  }
}

// Singleton instance for the application
export const connectionPool = new ConnectionPool();