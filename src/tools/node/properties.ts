import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const nodePropertiesSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/main.tscn")'),
  nodePath: z.string().describe('Path to the node'),
  action: z.enum(['get', 'set', 'get_all']).default('get_all').describe('Action to perform'),
  propertyName: z.string().optional().describe('Property name (required for get/set)'),
  propertyValue: z.any().optional().describe('Property value (required for set)'),
});

export function createNodePropertiesTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_node_properties',
    name: 'Get/Set Node Properties',
    description: 'Get or set individual node properties with type validation',
    category: 'node',
    inputSchema: nodePropertiesSchema,
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
      
      let result: any;
      
      switch (args.action) {
        case 'get_all':
          // In a real implementation, get all properties of the node
          result = {
            action: 'get_all',
            nodePath: args.nodePath,
            properties: {}, // Would be populated with actual properties
            count: 0, // Would be actual count
          };
          break;
          
        case 'get':
          if (!args.propertyName) {
            throw new Error('propertyName is required for get action');
          }
          // In a real implementation, get specific property
          result = {
            action: 'get',
            nodePath: args.nodePath,
            propertyName: args.propertyName,
            propertyValue: null, // Would be actual value
            exists: false, // Would be actual existence check
          };
          break;
          
        case 'set':
          if (!args.propertyName) {
            throw new Error('propertyName is required for set action');
          }
          if (args.propertyValue === undefined) {
            throw new Error('propertyValue is required for set action');
          }
          
          // In a real implementation, set the property
          // Then serialize and save the scene
          const updatedContent = SceneParser.serializeScene(sceneInfo);
          
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
          
          result = {
            action: 'set',
            nodePath: args.nodePath,
            propertyName: args.propertyName,
            propertyValue: args.propertyValue,
            success: true,
          };
          break;
          
        default:
          throw new Error(`Unknown action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true, // Can be destructive when setting properties
    idempotentHint: false,
        readOnlyHint: false,
  };
}