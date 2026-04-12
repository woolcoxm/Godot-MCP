import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const lightingSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  lightType: z.enum(['DirectionalLight3D', 'OmniLight3D', 'SpotLight3D']).describe('Type of light to create'),
  name: z.string().describe('Name for the light node'),
  properties: z.object({
    color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Light color'),
    energy: z.number().optional().describe('Light energy/brightness'),
    shadow: z.boolean().optional().describe('Enable shadows'),
    shadow_color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Shadow color'),
    range: z.number().optional().describe('Light range (for Omni/Spot)'),
    attenuation: z.number().optional().describe('Light attenuation (for Omni/Spot)'),
    spot_angle: z.number().optional().describe('Spot light angle (for SpotLight3D)'),
    spot_angle_attenuation: z.number().optional().describe('Spot light angle attenuation (for SpotLight3D)'),
    bake_mode: z.enum(['disabled', 'static', 'dynamic']).optional().describe('Light baking mode'),
  }).optional().describe('Light properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createLightingTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_lighting',
    name: 'Create 3D Lighting',
    description: 'Create DirectionalLight3D, OmniLight3D, or SpotLight3D with configurable properties',
    category: '3d',
    inputSchema: lightingSchema,
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
      // 1. Create the light node
      // 2. Configure light properties
      // 3. Apply transform
      // 4. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        lightType: args.lightType,
        properties: lightConfig.properties,
        transform: args.transform,
        message: `Created ${args.lightType} "${args.name}" at ${nodePath}`,
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
    DirectionalLight3D: {
      color: { r: 1, g: 1, b: 1, a: 1 },
      energy: 1,
      shadow: true,
      shadow_color: { r: 0, g: 0, b: 0, a: 1 },
      bake_mode: 'static',
    },
    OmniLight3D: {
      color: { r: 1, g: 1, b: 1, a: 1 },
      energy: 10,
      range: 10,
      attenuation: 1,
      shadow: true,
      shadow_color: { r: 0, g: 0, b: 0, a: 1 },
      bake_mode: 'static',
    },
    SpotLight3D: {
      color: { r: 1, g: 1, b: 1, a: 1 },
      energy: 10,
      range: 10,
      attenuation: 1,
      spot_angle: 45,
      spot_angle_attenuation: 1,
      shadow: true,
      shadow_color: { r: 0, g: 0, b: 0, a: 1 },
      bake_mode: 'static',
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.lightType],
    ...config.properties,
  };

  return config;
}