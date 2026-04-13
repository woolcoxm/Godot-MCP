import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';
import { ToolRegistry } from './tools/registry.js';
import { Transport } from './transports/transport.js';
import { registerAllTools } from './tools/register-tools.js';

export class GodotMCPServer {
  private server: McpServer;
  private transport: StdioServerTransport | null = null;
  private godotTransport!: Transport;
  private registry: ToolRegistry;

  constructor() {
    this.server = new McpServer({
      name: 'godot-mcp',
      version: '1.0.0',
    });

    // Initialize transport with auto-detection
    // We'll create it in start() method to handle async auto-detection
    
    // Initialize tool registry
    this.registry = new ToolRegistry(this.server);
    
    // Note: Transport will be set in start() method
    // Tools will be registered after transport is initialized

    this.setupServerInstructions();
    this.setupErrorHandling();
  }

  private setupServerInstructions(): void {
    // Note: setServerInfo might not be available in this version
    // We'll use server instructions in a different way if needed
    // For now, we'll skip this and rely on tool descriptions
  }

  private setupErrorHandling(): void {
    // Error handling will be done in individual tool handlers
  }

  async start(): Promise<void> {
    try {
      // Initialize transport with auto-detection
      this.godotTransport = await Transport.autoDetect({
        editorPort: parseInt(process.env.GODOT_EDITOR_PORT || '13337'),
        runtimePort: parseInt(process.env.GODOT_RUNTIME_PORT || '13338')
      });
      
      // Register all tools with the transport
      registerAllTools(this.registry, this.godotTransport);
      
      // Connect MCP server
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      logger.info('Godot MCP Server started');
      logger.info(`Transport mode: ${this.godotTransport.getMode()}`);
    } catch (error) {
      logger.error('Failed to start MCP Server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.transport) {
        await this.transport.close();
      }
      logger.info('Godot MCP Server stopped');
    } catch (error) {
      logger.error('Error stopping MCP Server:', error);
    }
  }
}