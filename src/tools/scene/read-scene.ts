import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const readSceneSchema = z.object({
  path: z.string().describe('Path to the scene file (e.g., "res://scenes/main.tscn")'),
  includeContent: z.boolean().default(false).describe('Include raw scene content in response'),
});

export function createReadSceneTool(transport: Transport): RegisteredTool {
  // Helper method to serialize node for JSON response
  function serializeNode(node: any): any {
    if (!node) return null;
    
    return {
      name: node.name,
      type: node.type,
      path: node.path,
      parent: node.parent,
      children: node.children,
      properties: node.properties,
      groups: node.groups,
      script: node.script,
      metadata: node.metadata,
    };
  }

  return {
    id: 'godot_read_scene',
    name: 'Read Godot Scene',
    description: 'Read and parse a Godot scene file into structured data',
    category: 'scene',
    inputSchema: readSceneSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.path },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read scene');
      }

      if (!result.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      const sceneInfo = SceneParser.parseScene(result.data.content);
      
      const response: any = {
        path: args.path,
        format: sceneInfo.format,
        load_steps: sceneInfo.load_steps,
        uid: sceneInfo.uid,
        root: serializeNode(sceneInfo.root),
        resources: sceneInfo.resources || [],
        sub_resources: sceneInfo.sub_resources || [],
        connections: sceneInfo.connections || [],
      };

      if (args.includeContent) {
        response.content = result.data.content;
      }

      return response;
    },
    readOnlyHint: true,
    idempotentHint: true,
  };
}