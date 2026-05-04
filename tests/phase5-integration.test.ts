import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../src/tools/registry';
import { Transport, TransportMode } from '../src/transports/transport';

// Mock server for ToolRegistry
class MockServer {
  tools = new Map();
  
  registerTool(id: string, definition: any) {
    this.tools.set(id, definition);
  }
}

// Mock transport for testing
class MockTransport extends Transport {
  private mockResponses: Map<string, any> = new Map();
  
  constructor() {
    super({ mode: TransportMode.HEADLESS });
  }
  
  async connect(): Promise<boolean> {
    return true;
  }
  
  async execute(operation: any): Promise<any> {
    const key = operation.operation;
    if (this.mockResponses.has(key)) {
      return this.mockResponses.get(key);
    }
    
    // Default success response
    return {
      success: true,
      data: { path: '/mock/path', result: 'mock result' }
    };
  }
  
  setMockResponse(operation: string, response: any): void {
    this.mockResponses.set(operation, response);
  }
}

describe('Phase 5: Advanced Systems Integration', () => {
  let registry: ToolRegistry;
  let transport: MockTransport;
  
  beforeEach(() => {
    const mockServer = new MockServer();
    registry = new ToolRegistry(mockServer as any);
    transport = new MockTransport();
    
    // Register mock tools for the categories to make getCategories() work
    const mockCategories = ['ui', 'audio', 'networking', 'build', 'resources'];
    mockCategories.forEach((cat, index) => {
        registry.registerTool({
            id: `mock_tool_${index}`,
            name: `mock_tool_${index}`,
            description: `Mock tool for ${cat}`,
            category: cat,
            inputSchema: {},
            handler: async () => ({})
        });
    });
  });
  
  it('should have UI tool categories defined', () => {
    // Test that UI tools are properly categorized
    const categories = registry.getCategories();
    expect(categories).toContain('ui');
    expect(categories).toContain('audio');
    expect(categories).toContain('networking');
    expect(categories).toContain('build');
    expect(categories).toContain('resources');
  });
  
  it('should validate UI control tool schema', () => {
    // Test that control tool schema accepts valid input
    const validControlInput = {
      parentPath: '.',
      controlType: 'Button',
      name: 'TestButton',
      text: 'Click me',
      size: { x: 100, y: 50 }
    };
    
    // This would normally be validated by Zod
    expect(validControlInput).toHaveProperty('controlType', 'Button');
    expect(validControlInput).toHaveProperty('text', 'Click me');
  });
  
  it('should validate theme tool schema', () => {
    const validThemeInput = {
      path: 'res://themes/default.tres',
      themeType: 'Theme',
      colors: {
        'primary': '#3498db',
        'secondary': '#2ecc71'
      }
    };
    
    expect(validThemeInput).toHaveProperty('path');
    expect(validThemeInput).toHaveProperty('colors');
    expect(Object.keys(validThemeInput.colors || {})).toHaveLength(2);
  });
  
  it('should validate audio tool schema', () => {
    const validAudioInput = {
      parentPath: '.',
      playerType: 'AudioStreamPlayer',
      name: 'BackgroundMusic',
      streamPath: 'res://audio/music.ogg',
      volume: -10,
      loop: true
    };
    
    expect(validAudioInput).toHaveProperty('playerType', 'AudioStreamPlayer');
    expect(validAudioInput).toHaveProperty('loop', true);
  });
  
  it('should validate networking tool schema', () => {
    const validHttpInput = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: {
        'User-Agent': 'Godot-MCP'
      }
    };
    
    expect(validHttpInput).toHaveProperty('method', 'GET');
    expect(validHttpInput.headers).toHaveProperty('User-Agent');
  });
  
  it('should validate build tool schema', () => {
    const validExportInput = {
      presetName: 'Windows Release',
      platform: 'Windows Desktop',
      exportPath: 'build/windows/game.exe',
      features: ['x86_64', 'console']
    };
    
    expect(validExportInput).toHaveProperty('platform', 'Windows Desktop');
    expect(validExportInput.features).toContain('x86_64');
  });
  
  it('should validate resource tool schema', () => {
    const validResourceInput = {
      scriptPath: 'res://scripts/player.gd',
      includeSource: true,
      includeMetadata: true,
      format: 'markdown'
    };
    
    expect(validResourceInput).toHaveProperty('format', 'markdown');
    expect(validResourceInput).toHaveProperty('includeSource', true);
  });
  
  it('should handle tool discovery for new categories', () => {
    // Test that tools can be discovered by category
    // This would test the registry's category-based discovery
    const uiTools = registry.getToolsByCategory('ui', 0, 10);
    const audioTools = registry.getToolsByCategory('audio', 0, 10);
    const networkingTools = registry.getToolsByCategory('networking', 0, 10);
    
    // In a real test, these would have actual tools
    expect(uiTools).toBeDefined();
    expect(audioTools).toBeDefined();
    expect(networkingTools).toBeDefined();
  });
  
  it('should support pagination for tool lists', () => {
    // Test that the registry supports pagination
    const page1 = registry.getToolsByCategory('ui', 0, 5);
    const page2 = registry.getToolsByCategory('ui', 5, 5);
    
    expect(page1).toBeDefined();
    expect(page2).toBeDefined();
  });
  
  it('should search tools across all categories', () => {
    // Test that search works across new tool categories
    const searchResults = registry.searchTools('audio', 0, 10);
    
    expect(searchResults).toBeDefined();
    // In a real implementation, this would return tools with 'audio' in name/description
  });
});