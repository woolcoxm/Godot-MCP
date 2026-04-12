import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';
import { ToolRegistry } from './tools/registry.js';

export class GodotMCPServer {
  private server: McpServer;
  private transport: StdioServerTransport | null = null;

  constructor() {
    this.server = new McpServer({
      name: 'godot-mcp',
      version: '1.0.0',
    });

    // Initialize tool registry which registers all tools
    new ToolRegistry(this.server);

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
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      logger.info('Godot MCP Server started');
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