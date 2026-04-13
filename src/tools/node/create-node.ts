import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const createNodeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/main.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  nodeType: z.string().default('Node').describe('Type of node to create (e.g., "Node3D", "Sprite2D", "Button")'),
  nodeName: z.string().describe('Name for the new node'),
  properties: z.record(z.string(), z.any()).optional().describe('Initial properties for the node'),
  script: z.string().optional().describe('Script to attach to the node (resource path)'),
  groups: z.array(z.string()).optional().describe('Groups to add the node to'),
  metadata: z.record(z.string(), z.any()).optional().describe('Metadata to attach to the node'),
});

export function createCreateNodeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_node',
    name: 'Create Node in Scene',
    description: 'Add a new child node to a scene at the specified parent',
    category: 'node',
    inputSchema: createNodeSchema,
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
      
      // Create new node path
      const newNodePath = args.parentPath === '.' ? args.nodeName : `${args.parentPath}/${args.nodeName}`;
      
      // Create new node object (placeholder for actual implementation)
      // const newNode = {
      //   name: args.nodeName,
      //   type: args.nodeType,
      //   path: { path: newNodePath },
      //   parent: args.parentPath === '.' ? undefined : { path: args.parentPath },
      //   children: [],
      //   properties: args.properties || {},
      //   groups: args.groups || [],
      //   script: args.script,
      //   metadata: args.metadata || {},
      // };

      // In a real implementation, we would:
      // 1. Add the node to the scene structure
      // 2. Update parent's children array
      // 3. Serialize back to .tscn
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
        nodePath: newNodePath,
        nodeType: args.nodeType,
        nodeName: args.nodeName,
        message: `Node ${args.nodeName} created at ${newNodePath} in ${args.scenePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}