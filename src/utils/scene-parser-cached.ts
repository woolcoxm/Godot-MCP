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
    const cacheKey = sceneCache.getSceneKey(path, true, true);
    return this.parseScene(content, cacheKey);
  }

  static invalidateScene(path: string): void {
    // Invalidate all variations of this scene in cache
    const keys = sceneCache.getKeys();
    const prefix = `scene:${path}:`;
    
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        sceneCache.delete(key);
        logger.debug(`Invalidated scene cache: ${key}`);
      }
    }
  }

  static getSceneFromCache(path: string, includeNodes: boolean = true, includeResources: boolean = true): SceneInfo | null {
    const key = sceneCache.getSceneKey(path, includeNodes, includeResources);
    return sceneCache.get(key);
  }

  static updateSceneInCache(path: string, sceneInfo: SceneInfo): void {
    const key = sceneCache.getSceneKey(path, true, true);
    sceneCache.set(key, sceneInfo);
    logger.debug(`Updated scene in cache: ${path}`);
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