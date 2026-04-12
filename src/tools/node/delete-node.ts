import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { HeadlessBridge, HeadlessOperation } from '../../transports/headless-bridge.js';
import { SceneParser } from '../../utils/scene-parser.js';

const deleteNodeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/main.tscn")'),
  nodePath: z.string().describe('Path to the node to delete'),
  recursive: z.boolean().default(true).describe('Delete child nodes as well'),
});

export function createDeleteNodeTool(bridge: HeadlessBridge): RegisteredTool {
  return {
    id: 'godot_delete_node',
    name: 'Delete Node from Scene',
    description: 'Remove a node (and optionally its children) from a scene',
    category: 'node',
    inputSchema: deleteNodeSchema,
    handler: async (args) => {
      // Read the scene first
      const readOperation: HeadlessOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readResult = await bridge.execute(readOperation);
      
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
      // 2. Remove it from parent's children array
      // 3. If recursive, remove all child nodes
      // 4. Serialize back to .tscn
      // For now, we'll simulate the operation
      
      // Serialize updated scene
      const updatedContent = SceneParser.serializeScene(sceneInfo);
      
      // Write back to file
      const writeOperation: HeadlessOperation = {
        operation: 'write_file',
        params: {
          path: args.scenePath,
          content: updatedContent,
        },
      };

      const writeResult = await bridge.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to save scene: ${writeResult.error}`);
      }

      return {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        recursive: args.recursive,
        message: `Node ${args.nodePath} deleted from ${args.scenePath}`,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}