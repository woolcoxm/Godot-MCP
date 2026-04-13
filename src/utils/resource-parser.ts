import { logger } from './logger.js';

export interface ResourceInfo {
  type: string;
  path?: string;
  properties: Record<string, any>;
  sub_resources?: SubResourceInfo[];
}

export interface SubResourceInfo {
  id: string;
  type: string;
  properties: Record<string, any>;
}

export class ResourceParser {
  static parseResource(content: string): ResourceInfo {
    const lines = content.split('\n');
    let currentSection: string | null = null;
    let currentSectionLines: string[] = [];
    
    const resourceInfo: Partial<ResourceInfo> = {
      properties: {},
      sub_resources: [],
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('[') && line.endsWith(']')) {
        // Process previous section
        if (currentSection) {
          this.processSection(currentSection, currentSectionLines, resourceInfo);
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
      this.processSection(currentSection, currentSectionLines, resourceInfo);
    }

    return resourceInfo as ResourceInfo;
  }

  private static processSection(
    section: string,
    lines: string[],
    resourceInfo: Partial<ResourceInfo>
  ): void {
    if (section.startsWith('gd_resource')) {
      this.processGdResource(section, resourceInfo);
    } else if (section.startsWith('ext_resource')) {
      this.processExtResource(section, lines, resourceInfo);
    } else if (section.startsWith('sub_resource')) {
      this.processSubResource(section, lines, resourceInfo);
    } else if (section === 'resource') {
      this.processResourceProperties(lines, resourceInfo);
    } else {
      logger.warn(`Unknown section in resource file: ${section}`);
    }
  }

  private static processGdResource(section: string, resourceInfo: Partial<ResourceInfo>): void {
    const params = this.parseSectionParams(section.substring('gd_resource'.length).trim());
    resourceInfo.type = params.type;
    
    // Store format and load_steps as properties
    if (params.format) {
      resourceInfo.properties.format = parseInt(params.format);
    }
    if (params.load_steps) {
      resourceInfo.properties.load_steps = parseInt(params.load_steps);
    }
    if (params.uid) {
      resourceInfo.properties.uid = params.uid;
    }
  }

  private static processExtResource(
    section: string,
    lines: string[],
    resourceInfo: Partial<ResourceInfo>
  ): void {
    const params = this.parseSectionParams(section.substring('ext_resource'.length).trim());
    
    // Store external resource reference
    const extResource = {
      type: params.type || '',
      path: params.path || '',
      id: params.id || '',
    };

    // Parse additional properties from lines
    for (const line of lines) {
      const [key, value] = this.parseProperty(line);
      if (key && value !== undefined) {
        (extResource as any)[key] = value;
      }
    }

    // Store in properties with ID as key
    resourceInfo.properties[`ExtResource(${extResource.id})`] = extResource;
  }

  private static processSubResource(
    section: string,
    lines: string[],
    resourceInfo: Partial<ResourceInfo>
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

    resourceInfo.sub_resources = resourceInfo.sub_resources || [];
    resourceInfo.sub_resources.push(subResource);
    
    // Also store reference in main properties
    resourceInfo.properties[`SubResource(${subResource.id})`] = subResource;
  }

  private static processResourceProperties(
    lines: string[],
    resourceInfo: Partial<ResourceInfo>
  ): void {
    for (const line of lines) {
      const [key, value] = this.parseProperty(line);
      if (key && value !== undefined) {
        resourceInfo.properties![key] = value;
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
      return this.parseVector(valueStr, 2);
    }
    if (valueStr.startsWith('Vector3(') && valueStr.endsWith(')')) {
      return this.parseVector(valueStr, 3);
    }
    if (valueStr.startsWith('Vector4(') && valueStr.endsWith(')')) {
      return this.parseVector(valueStr, 4);
    }
    if (valueStr.startsWith('Color(') && valueStr.endsWith(')')) {
      return this.parseColor(valueStr);
    }
    if (valueStr.startsWith('Transform2D(') && valueStr.endsWith(')')) {
      return valueStr; // Complex type, keep as string
    }
    if (valueStr.startsWith('Transform3D(') && valueStr.endsWith(')')) {
      return valueStr; // Complex type, keep as string
    }
    
    // Handle arrays
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      return this.parseArray(valueStr);
    }
    
    // Handle dictionaries
    if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
      return this.parseDictionary(valueStr);
    }
    
    // Handle packed arrays
    if (valueStr.startsWith('Packed') && valueStr.endsWith(')')) {
      return valueStr; // Keep packed arrays as strings for now
    }
    
    // Handle booleans
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;
    
    // Handle numbers
    if (!isNaN(Number(valueStr)) && valueStr.trim() !== '') {
      const num = Number(valueStr);
      // Check if it's an integer or float
      return valueStr.includes('.') ? num : Math.floor(num) === num ? num : num;
    }
    
    // Default to string
    return valueStr;
  }

  private static parseVector(vectorStr: string, dimensions: number): any {
    const content = vectorStr.substring(vectorStr.indexOf('(') + 1, vectorStr.length - 1);
    const parts = content.split(',').map(part => parseFloat(part.trim()));
    
    if (parts.length !== dimensions) {
      logger.warn(`Invalid vector format: ${vectorStr}`);
      return vectorStr;
    }
    
    const result: any = {};
    const coordNames = ['x', 'y', 'z', 'w'];
    
    for (let i = 0; i < dimensions; i++) {
      result[coordNames[i]] = parts[i];
    }
    
    return result;
  }

  private static parseColor(colorStr: string): any {
    const content = colorStr.substring(colorStr.indexOf('(') + 1, colorStr.length - 1);
    const parts = content.split(',').map(part => parseFloat(part.trim()));
    
    if (parts.length < 3 || parts.length > 4) {
      logger.warn(`Invalid color format: ${colorStr}`);
      return colorStr;
    }
    
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 ? parts[3] : 1.0,
    };
  }

  private static parseArray(arrayStr: string): any[] {
    const content = arrayStr.substring(1, arrayStr.length - 1);
    if (content.trim() === '') return [];
    
    // Simple parsing - split by commas not inside quotes or nested structures
    const items: string[] = [];
    let currentItem = '';
    let depth = 0;
    let inQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      }
      
      if (!inQuotes) {
        if (char === '[' || char === '{') {
          depth++;
        } else if (char === ']' || char === '}') {
          depth--;
        }
      }
      
      if (char === ',' && depth === 0 && !inQuotes) {
        items.push(currentItem.trim());
        currentItem = '';
      } else {
        currentItem += char;
      }
    }
    
    if (currentItem.trim()) {
      items.push(currentItem.trim());
    }
    
    return items.map(item => this.parseValue(item));
  }

  private static parseDictionary(dictStr: string): Record<string, any> {
    const content = dictStr.substring(1, dictStr.length - 1);
    if (content.trim() === '') return {};
    
    const result: Record<string, any> = {};
    const pairs: string[] = [];
    let currentPair = '';
    let depth = 0;
    let inQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      }
      
      if (!inQuotes) {
        if (char === '[' || char === '{') {
          depth++;
        } else if (char === ']' || char === '}') {
          depth--;
        }
      }
      
      if (char === ',' && depth === 0 && !inQuotes) {
        pairs.push(currentPair.trim());
        currentPair = '';
      } else {
        currentPair += char;
      }
    }
    
    if (currentPair.trim()) {
      pairs.push(currentPair.trim());
    }
    
    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = pair.substring(0, colonIndex).trim();
      const valueStr = pair.substring(colonIndex + 1).trim();
      
      // Remove quotes from key if present
      const cleanKey = key.startsWith('"') && key.endsWith('"') 
        ? key.substring(1, key.length - 1) 
        : key;
      
      result[cleanKey] = this.parseValue(valueStr);
    }
    
    return result;
  }

  static serializeResource(resourceInfo: ResourceInfo): string {
    const lines: string[] = [];
    
    // Calculate load steps (ext_resources + sub_resources)
    const extResourceCount = Object.keys(resourceInfo.properties).filter(key => 
      key.startsWith('ExtResource(')
    ).length;
    const subResourceCount = resourceInfo.sub_resources?.length || 0;
    const totalLoadSteps = extResourceCount + subResourceCount;
    
    // Write header
    lines.push(`[gd_resource type="${resourceInfo.type}" load_steps=${totalLoadSteps} format=3${resourceInfo.properties.uid ? ` uid="${resourceInfo.properties.uid}"` : ''}]`);
    lines.push('');
    
    // Write external resources (extracted from properties)
    const extResources: Array<{id: string, type: string, path: string}> = [];
    
    for (const [key, value] of Object.entries(resourceInfo.properties)) {
      if (key.startsWith('ExtResource(')) {
        const match = key.match(/ExtResource\((\d+)\)/);
        if (match) {
          const id = match[1];
          const extResource = value as any;
          lines.push(`[ext_resource type="${extResource.type}" path="${extResource.path}" id="${id}"]`);
        }
      }
    }
    
    if (extResources.length > 0) {
      lines.push('');
    }
    
    // Write sub-resources
    if (resourceInfo.sub_resources && resourceInfo.sub_resources.length > 0) {
      for (const subResource of resourceInfo.sub_resources) {
        lines.push(`[sub_resource type="${subResource.type}" id="${subResource.id}"]`);
        for (const [key, value] of Object.entries(subResource.properties)) {
          if (value !== undefined && value !== null) {
            lines.push(`${key} = ${this.serializeValue(value)}`);
          }
        }
        lines.push('');
      }
    }
    
    // Write resource properties (excluding ExtResource references)
    lines.push('[resource]');
    
    for (const [key, value] of Object.entries(resourceInfo.properties)) {
      if (!key.startsWith('ExtResource(') && !key.startsWith('SubResource(') && 
          key !== 'format' && key !== 'load_steps' && key !== 'uid') {
        if (value !== undefined && value !== null) {
          lines.push(`${key} = ${this.serializeValue(value)}`);
        }
      }
    }
    
    return lines.join('\n');
  }

  private static serializeValue(value: any): string {
    if (typeof value === 'string') {
      // Check if it's already a Godot type string
      if (value.startsWith('ExtResource(') || value.startsWith('SubResource(') ||
          value.startsWith('Vector2(') || value.startsWith('Vector3(') ||
          value.startsWith('Vector4(') || value.startsWith('Color(') ||
          value.startsWith('Transform2D(') || value.startsWith('Transform3D(') ||
          value.startsWith('Packed')) {
        return value;
      }
      // Quote strings that aren't Godot types
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    
    if (typeof value === 'number') {
      // Check if it's an integer or float
      return Math.floor(value) === value ? value.toString() : value.toString();
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
      if ('x' in value && 'y' in value && 'z' in value && !('w' in value)) {
        return `Vector3(${value.x}, ${value.y}, ${value.z})`;
      }
      if ('x' in value && 'y' in value && 'z' in value && 'w' in value) {
        return `Vector4(${value.x}, ${value.y}, ${value.z}, ${value.w})`;
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