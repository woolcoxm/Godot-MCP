import { logger } from './logger.js';
import { SceneInfo, NodeInfo, ResourceInfo, SubResourceInfo, ConnectionInfo } from '../types/godot.js';

export class SceneParser {
  static parseScene(content: string): SceneInfo {
    const lines = content.split('\n');
    let currentSection: string | null = null;
    let currentSectionLines: string[] = [];
    
    const sceneInfo: Partial<SceneInfo> = {
      path: '',
      root: {} as NodeInfo,
      resources: [],
      sub_resources: [],
      connections: [],
    };

    const nodes: Map<string, NodeInfo> = new Map();
    const nodeOrder: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('[') && line.endsWith(']')) {
        // Process previous section
        if (currentSection) {
          this.processSection(currentSection, currentSectionLines, sceneInfo, nodes, nodeOrder);
        }
        
        // Start new section
        currentSection = line.substring(1, line.length - 1);
        currentSectionLines = [];
      } else if (currentSection && line) {
        currentSectionLines.push(line);
      }
    }
    
    // Process the last section
    if (currentSection) {
      this.processSection(currentSection, currentSectionLines, sceneInfo, nodes, nodeOrder);
    }

    // Build node hierarchy
    this.buildNodeHierarchy(nodes, nodeOrder, sceneInfo);

    return sceneInfo as SceneInfo;
  }

  private static processSection(
    section: string,
    lines: string[],
    sceneInfo: Partial<SceneInfo>,
    nodes: Map<string, NodeInfo>,
    nodeOrder: string[]
  ): void {
    if (section.startsWith('gd_scene')) {
      this.processGdScene(section, sceneInfo);
    } else if (section.startsWith('ext_resource')) {
      this.processExtResource(section, lines, sceneInfo);
    } else if (section.startsWith('sub_resource')) {
      this.processSubResource(section, lines, sceneInfo);
    } else if (section.startsWith('node')) {
      this.processNode(section, lines, nodes, nodeOrder);
    } else if (section.startsWith('connection')) {
      this.processConnection(section, lines, sceneInfo);
    } else {
      logger.warn(`Unknown section type: ${section}`);
    }
  }

  private static processGdScene(section: string, sceneInfo: Partial<SceneInfo>): void {
    const params = this.parseSectionParams(section.substring('gd_scene'.length).trim());
    sceneInfo.format = parseInt(params.format || '3');
    sceneInfo.load_steps = parseInt(params.load_steps || '0');
    sceneInfo.uid = params.uid;
  }

  private static processExtResource(
    section: string,
    lines: string[],
    sceneInfo: Partial<SceneInfo>
  ): void {
    const params = this.parseSectionParams(section.substring('ext_resource'.length).trim());
    
    const resource: ResourceInfo = {
      id: params.id || '',
      type: params.type || '',
      path: params.path || '',
    };

    // Parse additional properties from lines
    for (const line of lines) {
      const [key, value] = this.parseProperty(line);
      if (key && value !== undefined) {
        (resource as any)[key] = value;
      }
    }

    sceneInfo.resources = sceneInfo.resources || [];
    sceneInfo.resources.push(resource);
  }

  private static processSubResource(
    section: string,
    lines: string[],
    sceneInfo: Partial<SceneInfo>
  ): void {
    const params = this.parseSectionParams(section.substring('sub_resource'.length).trim());
    
    const subResource: SubResourceInfo = {
      id: params.id || '',
      type: params.type || '',
      properties: {},
    };

    // Parse properties from lines
    for (const line of lines) {
      const [key, value] = this.parseProperty(line);
      if (key && value !== undefined) {
        subResource.properties[key] = value;
      }
    }

    sceneInfo.sub_resources = sceneInfo.sub_resources || [];
    sceneInfo.sub_resources.push(subResource);
  }

  private static processNode(
    section: string,
    lines: string[],
    nodes: Map<string, NodeInfo>,
    nodeOrder: string[]
  ): void {
    const params = this.parseSectionParams(section.substring('node'.length).trim());
    
    const nodePath = params.name || '';
    const nodeInfo: NodeInfo = {
      name: params.name || '',
      type: params.type || 'Node',
      path: { path: nodePath },
      parent: params.parent ? { path: params.parent } : undefined,
      children: [],
      properties: {},
      groups: [],
      metadata: {},
    };

    // Parse properties from lines
    for (const line of lines) {
      const [key, value] = this.parseProperty(line);
      if (key && value !== undefined) {
        if (key === 'script') {
          nodeInfo.script = this.parseResourceReference(value as string);
        } else if (key === 'groups') {
          nodeInfo.groups = this.parseArray(value as string);
        } else if (key === 'metadata') {
          nodeInfo.metadata = this.parseDictionary(value as string);
        } else {
          nodeInfo.properties[key] = value;
        }
      }
    }

    nodes.set(nodePath, nodeInfo);
    nodeOrder.push(nodePath);
  }

  private static processConnection(
    section: string,
    lines: string[],
    sceneInfo: Partial<SceneInfo>
  ): void {
    const params = this.parseSectionParams(section.substring('connection'.length).trim());
    
    const connection: ConnectionInfo = {
      from: { path: params.from || '' },
      signal: params.signal || '',
      to: { path: params.to || '' },
      method: params.method || '',
      binds: [],
      flags: parseInt(params.flags || '0'),
    };

    // Parse binds from lines if present
    for (const line of lines) {
      const [key, value] = this.parseProperty(line);
      if (key === 'binds' && value) {
        connection.binds = this.parseArray(value as string);
      }
    }

    sceneInfo.connections = sceneInfo.connections || [];
    sceneInfo.connections.push(connection);
  }

  private static buildNodeHierarchy(
    nodes: Map<string, NodeInfo>,
    nodeOrder: string[],
    sceneInfo: Partial<SceneInfo>
  ): void {
    // Find root node (node with no parent or parent=".")
    let rootNode: NodeInfo | null = null;
    
    for (const nodePath of nodeOrder) {
      const node = nodes.get(nodePath);
      if (!node) continue;
      
      if (!node.parent || node.parent.path === '.') {
        rootNode = node;
        sceneInfo.root = node;
        break;
      }
    }

    if (!rootNode) {
      logger.warn('No root node found in scene');
      return;
    }

    // Build parent-child relationships
    for (const nodePath of nodeOrder) {
      const node = nodes.get(nodePath);
      if (!node || !node.parent || node.parent.path === '.') continue;

      const parentPath = node.parent.path;
      const parentNode = nodes.get(parentPath);
      
      if (parentNode) {
        parentNode.children.push(node.path);
      } else {
        logger.warn(`Parent node not found: ${parentPath} for child: ${nodePath}`);
      }
    }
  }

  private static parseSectionParams(paramString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const regex = /(\w+)=("[^"]*"|\S+)/g;
    let match;
    
    while ((match = regex.exec(paramString)) !== null) {
      const key = match[1];
      let value = match[2];
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      
      params[key] = value;
    }
    
    return params;
  }

  private static parseProperty(line: string): [string | null, any] {
    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) return [null, undefined];
    
    const key = line.substring(0, equalsIndex).trim();
    const valueStr = line.substring(equalsIndex + 1).trim();
    
    try {
      const value = this.parseValue(valueStr);
      return [key, value];
    } catch (error) {
      logger.warn(`Failed to parse property value: ${key}=${valueStr}`, error);
      return [key, valueStr];
    }
  }

  private static parseValue(valueStr: string): any {
    // Handle empty string
    if (valueStr === '') return '';
    
    // Handle quoted strings
    if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
      return valueStr.substring(1, valueStr.length - 1);
    }
    
    // Handle resource references
    if (valueStr.startsWith('ExtResource(') && valueStr.endsWith(')')) {
      return valueStr;
    }
    if (valueStr.startsWith('SubResource(') && valueStr.endsWith(')')) {
      return valueStr;
    }
    
    // Handle Godot types
    if (valueStr.startsWith('Vector2(') && valueStr.endsWith(')')) {
      return this.parseVector2(valueStr);
    }
    if (valueStr.startsWith('Vector3(') && valueStr.endsWith(')')) {
      return this.parseVector3(valueStr);
    }
    if (valueStr.startsWith('Color(') && valueStr.endsWith(')')) {
      return this.parseColor(valueStr);
    }
    if (valueStr.startsWith('Transform3D(') && valueStr.endsWith(')')) {
      return this.parseTransform3D(valueStr);
    }
    
    // Handle arrays
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      return this.parseArray(valueStr);
    }
    
    // Handle dictionaries
    if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
      return this.parseDictionary(valueStr);
    }
    
    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
      return parseFloat(valueStr);
    }
    
    // Handle booleans
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;
    
    // Default to string
    return valueStr;
  }

  private static parseResourceReference(refStr: string): string {
    // Extract ID from ExtResource("id") or SubResource("id")
    const match = refStr.match(/\((?:")?([^")]+)(?:")?\)/);
    return match ? match[1] : refStr;
  }

  private static parseVector2(vecStr: string): { x: number; y: number } {
    const match = vecStr.match(/Vector2\(([^)]+)\)/);
    if (!match) return { x: 0, y: 0 };
    
    const parts = match[1].split(',').map(p => parseFloat(p.trim()));
    return { x: parts[0] || 0, y: parts[1] || 0 };
  }

  private static parseVector3(vecStr: string): { x: number; y: number; z: number } {
    const match = vecStr.match(/Vector3\(([^)]+)\)/);
    if (!match) return { x: 0, y: 0, z: 0 };
    
    const parts = match[1].split(',').map(p => parseFloat(p.trim()));
    return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
  }

  private static parseColor(colorStr: string): { r: number; g: number; b: number; a: number } {
    const match = colorStr.match(/Color\(([^)]+)\)/);
    if (!match) return { r: 0, g: 0, b: 0, a: 1 };
    
    const parts = match[1].split(',').map(p => parseFloat(p.trim()));
    return {
      r: parts[0] || 0,
      g: parts[1] || 0,
      b: parts[2] || 0,
      a: parts[3] !== undefined ? parts[3] : 1,
    };
  }

  private static parseTransform3D(transformStr: string): any {
    // Simplified parsing - in practice would need to parse 12 numbers
    const match = transformStr.match(/Transform3D\(([^)]+)\)/);
    if (!match) return null;
    
    // Transform3D is complex - return as string for now
    return transformStr;
  }

  private static parseArray(arrayStr: string): any[] {
    // Handle case where arrayStr is already an array
    if (Array.isArray(arrayStr)) {
      return arrayStr;
    }
    
    // Handle case where arrayStr is not a string
    if (typeof arrayStr !== 'string') {
      return [];
    }
    
    const content = arrayStr.substring(1, arrayStr.length - 1).trim();
    if (!content) return [];
    
    // Simple parsing for basic arrays
    const items: any[] = [];
    let current = '';
    let inQuotes = false;
    let depth = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char === '[' || char === '{') {
          depth++;
        } else if (char === ']' || char === '}') {
          depth--;
        } else if (char === ',' && depth === 0) {
          items.push(this.parseValue(current.trim()));
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      items.push(this.parseValue(current.trim()));
    }
    
    return items;
  }

  private static parseDictionary(dictStr: string): Record<string, any> {
    const content = dictStr.substring(1, dictStr.length - 1).trim();
    if (!content) return {};
    
    const dict: Record<string, any> = {};
    // Simplified parsing - in practice would need full parser
    // For now, return empty object
    return dict;
  }

  static serializeScene(sceneInfo: SceneInfo): string {
    const lines: string[] = [];
    
    // Write header
    lines.push(`[gd_scene load_steps=${sceneInfo.resources?.length || 0} format=3 uid="${sceneInfo.uid || ''}"]`);
    lines.push('');
    
    // Write external resources
    if (sceneInfo.resources && sceneInfo.resources.length > 0) {
      for (const resource of sceneInfo.resources) {
        lines.push(`[ext_resource type="${resource.type}" path="${resource.path}" id="${resource.id}"]`);
      }
      lines.push('');
    }
    
      // Write sub-resources
      if (sceneInfo.sub_resources && sceneInfo.sub_resources.length > 0) {
        for (const subResource of sceneInfo.sub_resources) {
        lines.push(`[sub_resource type="${subResource.type}" id="${subResource.id}"]`);
        for (const [key, value] of Object.entries(subResource.properties)) {
          lines.push(`${key} = ${this.serializeValue(value)}`);
        }
        lines.push('');
      }
    }
    
    // Write nodes (BFS traversal)
    const nodeQueue: { node: NodeInfo; path: string }[] = [
      { node: sceneInfo.root, path: sceneInfo.root.name }
    ];
    
    while (nodeQueue.length > 0) {
      const { node, path } = nodeQueue.shift()!;
      
      // Write node header
      const parent = path === node.name ? '.' : this.getParentPath(path);
      lines.push(`[node name="${node.name}" type="${node.type}" parent="${parent}"]`);
      
      // Write node properties
      for (const [key, value] of Object.entries(node.properties)) {
        if (value !== undefined && value !== null) {
          lines.push(`${key} = ${this.serializeValue(value)}`);
        }
      }
      
      // Write script if present
      if (node.script) {
        lines.push(`script = ExtResource("${node.script}")`);
      }
      
      // Write groups if present
      if (node.groups && node.groups.length > 0) {
        lines.push(`groups = ${this.serializeArray(node.groups)}`);
      }
      
      // Write metadata if present
      if (node.metadata && Object.keys(node.metadata).length > 0) {
        lines.push(`metadata = ${this.serializeDictionary(node.metadata)}`);
      }
      
      lines.push('');
      
      // Add children to queue
      for (const _childPath of node.children) {
        // In a real implementation, we'd need to look up the child node
        // For now, we'll just note that children need to be written
      }
    }
    
    // Write connections
    if (sceneInfo.connections && sceneInfo.connections.length > 0) {
      for (const connection of sceneInfo.connections) {
        lines.push(`[connection signal="${connection.signal}" from="${connection.from.path}" to="${connection.to.path}" method="${connection.method}" flags=${connection.flags}]`);
        if (connection.binds && connection.binds.length > 0) {
          lines.push(`binds = ${this.serializeArray(connection.binds)}`);
        }
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }

  private static getParentPath(path: string): string {
    const lastDot = path.lastIndexOf('/');
    return lastDot === -1 ? '.' : path.substring(0, lastDot);
  }

  private static serializeValue(value: any): string {
    if (typeof value === 'string') {
      // Check if it's already a Godot type string
      if (value.startsWith('ExtResource(') || value.startsWith('SubResource(') ||
          value.startsWith('Vector2(') || value.startsWith('Vector3(') ||
          value.startsWith('Color(') || value.startsWith('Transform3D(')) {
        return value;
      }
      // Quote strings that aren't Godot types
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (Array.isArray(value)) {
      return this.serializeArray(value);
    }
    
    if (value && typeof value === 'object') {
      // Handle Godot vector types
      if ('x' in value && 'y' in value && !('z' in value)) {
        return `Vector2(${value.x}, ${value.y})`;
      }
      if ('x' in value && 'y' in value && 'z' in value) {
        return `Vector3(${value.x}, ${value.y}, ${value.z})`;
      }
      if ('r' in value && 'g' in value && 'b' in value) {
        const a = 'a' in value ? value.a : 1;
        return `Color(${value.r}, ${value.g}, ${value.b}, ${a})`;
      }
      
      // Default to dictionary
      return this.serializeDictionary(value);
    }
    
    return String(value);
  }

  private static serializeArray(arr: any[]): string {
    const items = arr.map(item => this.serializeValue(item));
    return `[${items.join(', ')}]`;
  }

  private static serializeDictionary(dict: Record<string, any>): string {
    const items = Object.entries(dict).map(([key, value]) => 
      `"${key}": ${this.serializeValue(value)}`
    );
    return `{${items.join(', ')}}`;
  }
}