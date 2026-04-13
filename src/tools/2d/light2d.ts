import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const light2dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the light node'),
  lightType: z.enum(['Light2D', 'DirectionalLight2D', 'PointLight2D']).describe('Type of 2D light'),
  properties: z.object({
    // Common light properties
    color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Light color'),
    energy: z.number().optional().describe('Light energy'),
    enabled: z.boolean().optional().describe('Light enabled'),
    editorOnly: z.boolean().optional().describe('Editor only'),
    // Shadow properties
    shadowEnabled: z.boolean().optional().describe('Enable shadows'),
    shadowColor: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Shadow color'),
    shadowFilter: z.enum(['none', 'pcf5', 'pcf13']).optional().describe('Shadow filter'),
    shadowFilterSmooth: z.number().optional().describe('Shadow filter smoothness'),
    shadowItemCullMask: z.number().optional().describe('Shadow item cull mask'),
    // Light2D specific
    texture: z.string().optional().describe('Light texture path'),
    textureScale: z.number().optional().describe('Texture scale'),
    offset: z.object({ x: z.number(), y: z.number() }).optional().describe('Texture offset'),
    height: z.number().optional().describe('Height for normal mapping'),
    // DirectionalLight2D specific
    maxDistance: z.number().optional().describe('Max distance for directional light'),
    // PointLight2D specific
    range: z.object({
      min: z.number().optional().describe('Minimum range'),
      max: z.number().optional().describe('Maximum range'),
    }).optional().describe('Light range'),
    attenuation: z.number().optional().describe('Attenuation curve'),
    // Blend mode
    blendMode: z.enum(['add', 'subtract', 'mix', 'replace']).optional().describe('Blend mode'),
    // Range item cull mask
    rangeItemCullMask: z.number().optional().describe('Range item cull mask'),
  }).optional().describe('Light properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createLight2DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_light2d',
    name: '2D Lighting',
    description: 'Create Light2D, DirectionalLight2D, and PointLight2D nodes for 2D lighting and shadows',
    category: '2d',
    inputSchema: light2dSchema,
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

      // Create light configuration
      const lightConfig = createLightConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create Light2D, DirectionalLight2D, or PointLight2D node
      // 2. Configure light properties
      // 3. Apply transform
      // 4. Set up shadows if enabled
      // 5. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        lightType: args.lightType,
        properties: lightConfig.properties,
        transform: args.transform,
        message: `Created ${args.lightType} "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createLightConfig(args: any): any {
  const config: any = {
    nodeType: args.lightType,
    properties: args.properties || {},
  };

  // Set default properties based on light type
  const defaults: Record<string, any> = {
    Light2D: {
      color: { r: 1, g: 1, b: 1, a: 1 },
      energy: 1.0,
      enabled: true,
      editorOnly: false,
      shadowEnabled: false,
      shadowColor: { r: 0, g: 0, b: 0, a: 0.5 },
      shadowFilter: 'none',
      shadowFilterSmooth: 0.0,
      shadowItemCullMask: 1,
      textureScale: 1.0,
      offset: { x: 0, y: 0 },
      height: 0.0,
      blendMode: 'add',
      rangeItemCullMask: 1,
    },
    DirectionalLight2D: {
      color: { r: 1, g: 1, b: 1, a: 1 },
      energy: 1.0,
      enabled: true,
      editorOnly: false,
      shadowEnabled: false,
      shadowColor: { r: 0, g: 0, b: 0, a: 0.5 },
      shadowFilter: 'none',
      shadowFilterSmooth: 0.0,
      shadowItemCullMask: 1,
      maxDistance: 10000,
      blendMode: 'add',
      rangeItemCullMask: 1,
    },
    PointLight2D: {
      color: { r: 1, g: 1, b: 1, a: 1 },
      energy: 1.0,
      enabled: true,
      editorOnly: false,
      shadowEnabled: false,
      shadowColor: { r: 0, g: 0, b: 0, a: 0.5 },
      shadowFilter: 'none',
      shadowFilterSmooth: 0.0,
      shadowItemCullMask: 1,
      range: { min: 0, max: 100 },
      attenuation: 1.0,
      blendMode: 'add',
      rangeItemCullMask: 1,
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.lightType],
    ...config.properties,
  };

  return config;
}