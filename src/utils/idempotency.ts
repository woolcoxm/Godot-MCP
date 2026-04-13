import { Transport, TransportOperation } from '../transports/transport.js';
import { SceneParser } from './scene-parser.js';
import { ResourceParser } from './resource-parser.js';
import { NodeInfo } from '../types/godot.js';

export class IdempotencyChecker {
  /**
   * Check if a node already exists at the specified path
   */
  static async checkNodeExists(
    transport: Transport,
    scenePath: string,
    nodePath: string
  ): Promise<{ exists: boolean; node?: NodeInfo }> {
    try {
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data?.content) {
        return { exists: false };
      }

      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      const node = SceneParser.findNodeByPath(sceneInfo, nodePath);
      
      return {
        exists: !!node,
        node: node || undefined,
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Check if a signal connection already exists
   */
  static async checkSignalConnectionExists(
    transport: Transport,
    scenePath: string,
    sourceNodePath: string,
    signalName: string,
    targetNodePath: string,
    targetMethod: string
  ): Promise<{ exists: boolean }> {
    try {
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data?.content) {
        return { exists: false };
      }

      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      
      if (!sceneInfo.connections) {
        return { exists: false };
      }

      const exists = sceneInfo.connections.some(conn =>
        conn.from.path === sourceNodePath &&
        conn.signal === signalName &&
        conn.to.path === targetNodePath &&
        conn.method === targetMethod
      );
      
      return { exists };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Check if a node is already in a group
   */
  static async checkNodeInGroup(
    transport: Transport,
    scenePath: string,
    nodePath: string,
    groupName: string
  ): Promise<{ inGroup: boolean }> {
    try {
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data?.content) {
        return { inGroup: false };
      }

      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      const node = SceneParser.findNodeByPath(sceneInfo, nodePath);
      
      if (!node || !node.groups) {
        return { inGroup: false };
      }

      return { inGroup: node.groups.includes(groupName) };
    } catch (error) {
      return { inGroup: false };
    }
  }

  /**
   * Check if a file already exists with the same content
   */
  static async checkFileContent(
    transport: Transport,
    filePath: string,
    expectedContent: string
  ): Promise<{ exists: boolean; matches: boolean; currentContent?: string }> {
    try {
      const readOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: filePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data?.content) {
        return { exists: false, matches: false };
      }

      const currentContent = readResult.data.content;
      const matches = currentContent === expectedContent;
      
      return {
        exists: true,
        matches,
        currentContent,
      };
    } catch (error) {
      return { exists: false, matches: false };
    }
  }

  /**
   * Check if a resource already exists with similar properties
   */
  static async checkResourceExists(
    transport: Transport,
    resourcePath: string,
    expectedType?: string,
    expectedProperties?: Record<string, any>
  ): Promise<{ exists: boolean; typeMatches?: boolean; propertiesMatch?: boolean }> {
    try {
      const readOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: resourcePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data?.content) {
        return { exists: false };
      }

      const resourceInfo = ResourceParser.parseResource(readResult.data.content);
      
      let typeMatches = true;
      let propertiesMatch = true;
      
      if (expectedType && resourceInfo.type !== expectedType) {
        typeMatches = false;
      }
      
      if (expectedProperties) {
        for (const [key, expectedValue] of Object.entries(expectedProperties)) {
          if (resourceInfo.properties[key] !== expectedValue) {
            propertiesMatch = false;
            break;
          }
        }
      }
      
      return {
        exists: true,
        typeMatches,
        propertiesMatch,
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Check if a script already exists with similar content
   */
  static async checkScriptExists(
    transport: Transport,
    scriptPath: string,
    expectedContent?: string
  ): Promise<{ exists: boolean; contentMatches?: boolean }> {
    try {
      const readOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: scriptPath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data?.content) {
        return { exists: false };
      }

      const currentContent = readResult.data.content;
      
      if (expectedContent) {
        const contentMatches = this.normalizeScriptContent(currentContent) === 
                              this.normalizeScriptContent(expectedContent);
        return {
          exists: true,
          contentMatches,
        };
      }
      
      return { exists: true };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Normalize script content for comparison (remove whitespace, comments, etc.)
   */
  private static normalizeScriptContent(content: string): string {
    // Remove comments
    let normalized = content.replace(/#[^\n]*\n/g, '\n');
    
    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  /**
   * Check if a project setting already exists with the same value
   */
  static async checkProjectSetting(
    transport: Transport,
    section: string,
    key: string,
    expectedValue?: any
  ): Promise<{ exists: boolean; valueMatches?: boolean; currentValue?: any }> {
    try {
      const readOperation: TransportOperation = {
        operation: 'read_project_settings',
        params: { section, key },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        return { exists: false };
      }

      const currentValue = readResult.data;
      const exists = currentValue !== undefined;
      
      if (expectedValue !== undefined) {
        const valueMatches = JSON.stringify(currentValue) === JSON.stringify(expectedValue);
        return {
          exists,
          valueMatches,
          currentValue,
        };
      }
      
      return { exists, currentValue };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Generate idempotency key for an operation
   */
  static generateIdempotencyKey(operation: string, params: Record<string, any>): string {
    // Create a deterministic key based on operation and parameters
    const keyData = {
      operation,
      params: this.normalizeParams(params),
    };
    
    return JSON.stringify(keyData);
  }

  /**
   * Normalize parameters for idempotency checking
   */
  private static normalizeParams(params: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }
      
      if (typeof value === 'object') {
        // Sort object keys for consistency
        if (Array.isArray(value)) {
          normalized[key] = value.map(item => 
            typeof item === 'object' ? this.normalizeParams(item) : item
          );
        } else {
          normalized[key] = this.normalizeParams(value);
        }
      } else {
        normalized[key] = value;
      }
    }
    
    // Sort keys alphabetically
    const sorted: Record<string, any> = {};
    Object.keys(normalized).sort().forEach(key => {
      sorted[key] = normalized[key];
    });
    
    return sorted;
  }
}