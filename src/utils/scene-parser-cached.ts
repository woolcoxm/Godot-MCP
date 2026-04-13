import { SceneParser } from './scene-parser.js';
import { SceneInfo } from '../types/godot.js';
import { sceneCache } from './cache.js';
import { logger } from './logger.js';

export class CachedSceneParser {
  static parseScene(content: string, cacheKey?: string): SceneInfo {
    // Generate cache key if not provided
    const key = cacheKey || `scene:content:${hashString(content.substring(0, 1000))}`;
    
    // Check cache
    const cached = sceneCache.get(key);
    if (cached) {
      logger.debug(`Scene cache hit: ${key}`);
      return cached;
    }
    
    logger.debug(`Scene cache miss: ${key}`);
    
    // Parse scene
    const sceneInfo = SceneParser.parseScene(content);
    
    // Cache the result
    sceneCache.set(key, sceneInfo);
    
    return sceneInfo;
  }

  static parseSceneFromPath(path: string, content: string): SceneInfo {
    const cacheKey = `scene:path:${path}`;
    
    // Check cache
    const cached = sceneCache.get(cacheKey);
    if (cached) {
      logger.debug(`Scene cache hit (path): ${path}`);
      return cached;
    }
    
    logger.debug(`Scene cache miss (path): ${path}`);
    
    // Parse scene
    const sceneInfo = SceneParser.parseScene(content);
    
    // Cache the result
    sceneCache.set(cacheKey, sceneInfo);
    
    return sceneInfo;
  }

  static getCachedScene(path: string): SceneInfo | null {
    const cacheKey = `scene:path:${path}`;
    return sceneCache.get(cacheKey) || null;
  }

  static invalidateScene(path: string): void {
    const cacheKey = `scene:path:${path}`;
    sceneCache.delete(cacheKey);
    logger.debug(`Invalidated scene cache: ${path}`);
  }

  static invalidateAll(): void {
    // Note: We can't iterate over all keys with the current Cache implementation
    // This would require adding a getKeys() method to the Cache class
    logger.debug('Scene cache invalidation not fully implemented (needs getKeys method)');
  }
}

// Simple string hash function for cache keys
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}