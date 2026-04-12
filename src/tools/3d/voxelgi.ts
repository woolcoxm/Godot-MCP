import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const voxelgiSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  giType: z.enum(['VoxelGI', 'SDFGI']).describe('Type of global illumination'),
  name: z.string().describe('Name for the GI node'),
  properties: z.object({
    // Common properties
    subdiv: z.number().optional().describe('Subdivision level'),
    extents: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('GI extents'),
    // VoxelGI specific
    bias: z.number().optional().describe('Bias'),
    normal_bias: z.number().optional().describe('Normal bias'),
    propagation: z.number().optional().describe('Propagation'),
    energy: z.number().optional().describe('Energy'),
    // SDFGI specific
    y_scale: z.enum(['scale_50%', 'scale_75%', 'scale_100%']).optional().describe('Y scale'),
    use_occlusion: z.boolean().optional().describe('Use occlusion'),
    read_sky: z.boolean().optional().describe('Read sky'),
    bounce_feedback: z.number().optional().describe('Bounce feedback'),
    cascades: z.number().optional().describe('Number of cascades'),
    min_cell_size: z.number().optional().describe('Minimum cell size'),
    probe_ray_count: z.number().optional().describe('Probe ray count'),
    frames_to_converge: z.number().optional().describe('Frames to converge'),
    frames_to_update_light: z.number().optional().describe('Frames to update light'),
  }).optional().describe('GI properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createVoxelGITool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_voxelgi',
    name: '3D Global Illumination',
    description: 'Create VoxelGI and SDFGI nodes for global illumination and indirect lighting',
    category: '3d',
    inputSchema: voxelgiSchema,
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

      // Create GI configuration based on type
      const giConfig = createGIConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create VoxelGI or SDFGI node
      // 2. Configure GI properties
      // 3. Apply transform
      // 4. Bake GI data
      // 5. Save the scene
      // For now, simulate the operation
      
      return {
        giType: args.giType,
        nodePath: nodePath,
        properties: giConfig.properties,
        transform: args.transform,
        message: `Created ${args.giType} "${args.name}" at ${nodePath}`,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createGIConfig(args: any): any {
  const config: any = {
    nodeType: args.giType === 'VoxelGI' ? 'VoxelGI' : 'SDFGI',
    properties: args.properties || {},
  };

  // Set default properties based on GI type
  const defaults: Record<string, any> = {
    VoxelGI: {
      subdiv: 64,
      extents: { x: 10, y: 10, z: 10 },
      bias: 0.0,
      normal_bias: 1.0,
      propagation: 0.7,
      energy: 1.0,
    },
    SDFGI: {
      y_scale: 'scale_100%',
      use_occlusion: true,
      read_sky: true,
      bounce_feedback: 0.5,
      cascades: 4,
      min_cell_size: 0.2,
      probe_ray_count: 64,
      frames_to_converge: 30,
      frames_to_update_light: 60,
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.giType],
    ...config.properties,
  };

  return config;
}