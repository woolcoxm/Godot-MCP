import { logger } from './logger.js';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

export interface CacheOptions {
  maxSize: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private options: CacheOptions;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      defaultTTL: options.defaultTTL || 60000, // 1 minute
      cleanupInterval: options.cleanupInterval || 30000, // 30 seconds
    };

    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.options.cleanupInterval);
  }

  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // If still over max size, remove oldest entries
    if (this.cache.size > this.options.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.options.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} cache entries`);
    }
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.options.defaultTTL);

    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt,
      hits: 0
    });

    // Trigger cleanup if over max size
    if (this.cache.size > this.options.maxSize * 1.5) {
      this.cleanupExpired();
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): {
    size: number;
    hits: number;
    oldest: number;
    newest: number;
  } {
    let totalHits = 0;
    let oldest = Date.now();
    let newest = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }

    return {
      size: this.cache.size,
      hits: totalHits,
      oldest,
      newest
    };
  }

  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

// Specialized caches for different types of data
export class SceneCache extends Cache<any> {
  constructor() {
    super({
      maxSize: 100,
      defaultTTL: 300000, // 5 minutes for scenes
      cleanupInterval: 60000 // 1 minute
    });
  }
}

export class ScriptCache extends Cache<string> {
  constructor() {
    super({
      maxSize: 200,
      defaultTTL: 300000, // 5 minutes for scripts
      cleanupInterval: 60000
    });
  }
}

export class ProjectCache extends Cache<any> {
  constructor() {
    super({
      maxSize: 10,
      defaultTTL: 600000, // 10 minutes for project data
      cleanupInterval: 120000 // 2 minutes
    });
  }
}

// Singleton instances
export const sceneCache = new SceneCache();
export const scriptCache = new ScriptCache();
export const projectCache = new ProjectCache();