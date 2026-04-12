import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { HeadlessBridge, HeadlessOperation } from '../../transports/headless-bridge.js';
import { SceneParser } from '../../utils/scene-parser.js';

const saveSceneSchema = z.object({
  path: z.string().describe('Path where to save the scene (e.g., "res://scenes/main.tscn")'),
  sceneData: z.record(z.string(), z.any()).describe('Scene data structure to serialize'),
  overwrite: z.boolean().default(true).describe('Overwrite existing file if it exists'),
});

export function createSaveSceneTool(bridge: HeadlessBridge): RegisteredTool {
  return {
    id: 'godot_save_scene',
    name: 'Save Godot Scene',
    description: 'Serialize scene data structure to .tscn file format',
    category: 'scene',
    inputSchema: saveSceneSchema,
    handler: async (args) => {
      // Convert scene data to SceneInfo structure
      const sceneInfo = convertToSceneInfo(args.sceneData);
      
      // Serialize to .tscn format
      const content = SceneParser.serializeScene(sceneInfo);
      
      // Check if file exists and we shouldn't overwrite
      if (!args.overwrite) {
        const checkOperation: HeadlessOperation = {
          operation: 'read_file',
          params: { path: args.path },
        };
        
        const checkResult = await bridge.execute(checkOperation);
        if (checkResult.success) {
          throw new Error(`File already exists at ${args.path}. Use overwrite=true to replace it.`);
        }
      }

      // Write the scene file
      const operation: HeadlessOperation = {
        operation: 'write_file',
        params: {
          path: args.path,
          content: content,
        },
      };

      const result = await bridge.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save scene');
      }

      return {
        path: args.path,
        bytesWritten: result.data?.bytes_written || content.length,
        message: `Scene saved successfully to ${args.path}`,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function convertToSceneInfo(sceneData: any): any {
  // Convert from tool-friendly format to SceneParser format
  // This is a simplified conversion - would need more robust handling
  
  const sceneInfo: any = {
    path: sceneData.path || '',
    format: sceneData.format || 3,
    loadSteps: sceneData.loadSteps || 0,
    uid: sceneData.uid || '',
    root: convertNode(sceneData.root),
    resources: sceneData.resources || [],
    subResources: sceneData.subResources || [],
    connections: sceneData.connections || [],
  };

  return sceneInfo;
}

function convertNode(nodeData: any): any {
  if (!nodeData) return null;
  
  return {
    name: nodeData.name,
    type: nodeData.type,
    path: typeof nodeData.path === 'string' ? { path: nodeData.path } : nodeData.path,
    parent: nodeData.parent ? (typeof nodeData.parent === 'string' ? { path: nodeData.parent } : nodeData.parent) : undefined,
    children: nodeData.children || [],
    properties: nodeData.properties || {},
    groups: nodeData.groups || [],
    script: nodeData.script,
    metadata: nodeData.metadata || {},
  };
}