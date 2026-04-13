import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const readScriptSchema = z.object({
  path: z.string().describe('Path to the script file (e.g., "res://scripts/player.gd")'),
  includeSource: z.boolean().default(false).describe('Include the full source code in the response'),
});

export function createReadScriptTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_read_script',
    name: 'Read GDScript',
    description: 'Parse a GDScript file into structured representation',
    category: 'script',
    inputSchema: readScriptSchema,
    handler: async (args) => {
      // Read the script file
      const operation: TransportOperation = {
        operation: 'read_file',
        params: { path: args.path },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read script');
      }

      if (!result.data?.content) {
        throw new Error('Script file is empty or could not be read');
      }

      const content = result.data.content;
      
      // In a real implementation, we would parse the GDScript into structured format
      // For now, return basic information
      const scriptInfo: any = {
        path: args.path,
        size: content.length,
        lines: content.split('\n').length,
        // Placeholder for parsed structure
        parsed: {
          class_name: null,
          extends_class: 'Node', // Default assumption
          signals: [],
          variables: [],
          functions: [],
          constants: [],
          enums: [],
        },
      };

      if (args.includeSource) {
        scriptInfo.source = content;
      }

      return scriptInfo;
    },
    readOnlyHint: true,
    idempotentHint: true,
        destructiveHint: false,
  };
}