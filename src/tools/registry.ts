import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { CATEGORIES } from './categories.js';

export interface RegisteredTool {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: z.ZodType<any>;
  handler: (args: any) => Promise<any>;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
}

export class ToolRegistry {
  private server: McpServer;
  private tools: Map<string, RegisteredTool> = new Map();

  constructor(server: McpServer) {
    this.server = server;
    this.registerDiscoveryTools();
  }

  private registerDiscoveryTools(): void {
    this.registerTool({
      id: 'godot_list_categories',
      name: 'List Godot Tool Categories',
      description: 'List all available tool categories in the Godot MCP server',
      category: 'system',
      inputSchema: z.object({}),
      handler: async () => {
        return {
          categories: CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            toolCount: cat.toolCount,
          })),
        };
      },
      readOnlyHint: true,
      idempotentHint: true,
    });

    this.registerTool({
      id: 'godot_list_tools',
      name: 'List Tools in Category',
      description: 'List tools within a specific category (paginated, 20 per page)',
      category: 'system',
      inputSchema: z.object({
        category: z.string().describe('Category ID to list tools from'),
        page: z.number().min(1).default(1).describe('Page number (1-based)'),
        pageSize: z.number().min(1).max(50).default(20).describe('Number of tools per page'),
      }),
      handler: async ({ category, page, pageSize }) => {
        const categoryTools = Array.from(this.tools.values())
          .filter(tool => tool.category === category);
        
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTools = categoryTools.slice(startIndex, endIndex);
        
        const tools = paginatedTools.map(tool => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          category: tool.category,
          readOnlyHint: tool.readOnlyHint,
          destructiveHint: tool.destructiveHint,
          idempotentHint: tool.idempotentHint,
        }));

        return {
          category,
          page,
          pageSize,
          totalTools: categoryTools.length,
          totalPages: Math.ceil(categoryTools.length / pageSize),
          tools,
        };
      },
      readOnlyHint: true,
      idempotentHint: true,
    });

    this.registerTool({
      id: 'godot_search_tools',
      name: 'Search Tools',
      description: 'Search tools by keyword across all categories',
      category: 'system',
      inputSchema: z.object({
        query: z.string().min(1).describe('Search query'),
        limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
      }),
      handler: async ({ query, limit }) => {
        const searchQuery = query.toLowerCase();
        const results: any[] = [];
        
        for (const tool of this.tools.values()) {
          if (
            tool.id.toLowerCase().includes(searchQuery) ||
            tool.name.toLowerCase().includes(searchQuery) ||
            tool.description.toLowerCase().includes(searchQuery) ||
            tool.category.toLowerCase().includes(searchQuery)
          ) {
            results.push({
              id: tool.id,
              name: tool.name,
              description: tool.description,
              category: tool.category,
              readOnlyHint: tool.readOnlyHint,
              destructiveHint: tool.destructiveHint,
              idempotentHint: tool.idempotentHint,
              matchScore: this.calculateMatchScore(tool, searchQuery),
            });
            
            if (results.length >= limit) {
              break;
            }
          }
        }
        
        results.sort((a, b) => b.matchScore - a.matchScore);
        
        return {
          query,
          results,
          totalMatches: results.length,
        };
      },
      readOnlyHint: true,
      idempotentHint: true,
    });
  }

  private calculateMatchScore(tool: RegisteredTool, query: string): number {
    let score = 0;
    
    if (tool.id.toLowerCase().includes(query)) score += 3;
    if (tool.name.toLowerCase().includes(query)) score += 2;
    if (tool.description.toLowerCase().includes(query)) score += 1;
    if (tool.category.toLowerCase().includes(query)) score += 0.5;
    
    return score;
  }

  registerTool(tool: RegisteredTool): void {
    if (this.tools.has(tool.id)) {
      logger.warn(`Tool ${tool.id} already registered, skipping`);
      return;
    }

    this.tools.set(tool.id, tool);
    this.registerWithServer(tool);
    logger.debug(`Registered tool: ${tool.id}`);
  }

  private registerWithServer(tool: RegisteredTool): void {
    const annotations: any = {};
    if (tool.readOnlyHint) annotations.readOnlyHint = true;
    if (tool.destructiveHint) annotations.destructiveHint = true;
    if (tool.idempotentHint) annotations.idempotentHint = true;

    this.server.registerTool(
      tool.id,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations,
      },
      async (args: any) => {
        try {
          logger.debug(`Executing tool: ${tool.id}`, args);
          const validatedArgs = tool.inputSchema.parse(args);
          const result = await tool.handler(validatedArgs);
          logger.debug(`Tool ${tool.id} completed successfully`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          logger.error(`Tool ${tool.id} failed:`, error);
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  getTool(id: string): RegisteredTool | undefined {
    return this.tools.get(id);
  }

  getToolsByCategory(categoryId: string): RegisteredTool[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === categoryId);
  }

  getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }
}