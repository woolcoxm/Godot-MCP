import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const createSceneSchema = z.object({
  path: z.string().describe('Path where the scene should be created (e.g., "res://scenes/main.tscn")'),
  rootType: z.enum(['Node3D', 'Node2D', 'Control', 'Node']).default('Node3D').describe('Type of root node'),
  rootName: z.string().default('Root').describe('Name of the root node'),
  initialProperties: z.record(z.string(), z.any()).optional().describe('Initial properties for the root node'),
});

export function createCreateSceneTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_scene',
    name: 'Create Godot Scene',
    description: 'Create a new Godot scene file with specified root node',
    category: 'scene',
    inputSchema: createSceneSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'create_scene',
        params: {
          path: args.path,
          root_type: args.rootType,
          root_name: args.rootName,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create scene');
      }

      // If initial properties were provided, modify the scene
      if (args.initialProperties && Object.keys(args.initialProperties).length > 0) {
        // Read the created scene
        const readOperation: TransportOperation = {
          operation: 'read_scene',
          params: { path: args.path },
        };
        
        const readResult = await transport.execute(readOperation);
        
        if (readResult.success && readResult.data?.content) {
          // Parse the scene
          const sceneInfo = SceneParser.parseScene(readResult.data.content);
          
          // Update root node properties
          if (sceneInfo.root) {
            sceneInfo.root.properties = {
              ...sceneInfo.root.properties,
              ...args.initialProperties,
            };
            
            // Serialize back
            const updatedContent = SceneParser.serializeScene(sceneInfo);
            
            // Write back
            const writeOperation: TransportOperation = {
              operation: 'write_file',
              params: {
                path: args.path,
                content: updatedContent,
              },
            };
            
            const writeResult = await transport.execute(writeOperation);
            if (!writeResult.success) {
              throw new Error(`Failed to update scene properties: ${writeResult.error}`);
            }
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Created scene ${args.rootName} (${args.rootType}) at ${args.path}`
          }
        ]
      };
    },
    destructiveHint: false,
    idempotentHint: false,
  };
}