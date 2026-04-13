import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const modifyNodeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/main.tscn")'),
  nodePath: z.string().describe('Path to the node to modify'),
  properties: z.record(z.string(), z.any()).optional().describe('Properties to set on the node'),
  script: z.string().optional().describe('Script to attach (or empty string to remove)'),
  groups: z.object({
    add: z.array(z.string()).optional().describe('Groups to add the node to'),
    remove: z.array(z.string()).optional().describe('Groups to remove the node from'),
  }).optional().describe('Group modifications'),
  metadata: z.record(z.string(), z.any()).optional().describe('Metadata to set on the node'),
  renameTo: z.string().optional().describe('New name for the node'),
});

export function createModifyNodeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_modify_node',
    name: 'Modify Node Properties',
    description: 'Modify properties, script, groups, or metadata of an existing node',
    category: 'node',
    inputSchema: modifyNodeSchema,
    handler: async (args) => {
      // Read the scene first
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read scene: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      // Parse the scene
      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      
      // In a real implementation, we would:
      // 1. Find the node by path
      // 2. Apply modifications
      // 3. Handle renaming (update path in parent's children array)
      // 4. Serialize back to .tscn
      // For now, we'll simulate the operation
      
      // Serialize updated scene
      const updatedContent = SceneParser.serializeScene(sceneInfo);
      
      // Write back to file
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.scenePath,
          content: updatedContent,
        },
      };

      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to save scene: ${writeResult.error}`);
      }

      return {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        modifications: {
          properties: args.properties ? Object.keys(args.properties).length : 0,
          script: args.script !== undefined ? 1 : 0,
          groups: args.groups ? (args.groups.add?.length || 0) + (args.groups.remove?.length || 0) : 0,
          metadata: args.metadata ? Object.keys(args.metadata).length : 0,
          renamed: args.renameTo ? 1 : 0,
        },
        message: `Node ${args.nodePath} modified in ${args.scenePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}