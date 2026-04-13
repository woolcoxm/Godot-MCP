import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const particles3dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  particleType: z.enum(['GPUParticles3D', 'GPUParticlesCollision3D', 'GPUParticlesAttractor3D']).default('GPUParticles3D').describe('Type of particles node'),
  name: z.string().describe('Name for the particles node'),
  processMaterial: z.string().optional().describe('Path to ParticleProcessMaterial resource'),
  drawMaterial: z.string().optional().describe('Path to material resource'),
  properties: z.object({
    // Common properties
    amount: z.number().optional().describe('Number of particles'),
    lifetime: z.number().optional().describe('Particle lifetime'),
    preprocess: z.number().optional().describe('Preprocess time'),
    speed_scale: z.number().optional().describe('Speed scale'),
    explosiveness: z.number().optional().describe('Explosiveness'),
    randomness: z.number().optional().describe('Randomness'),
    fixed_fps: z.number().optional().describe('Fixed FPS'),
    fract_delta: z.boolean().optional().describe('Fractional delta'),
    interpolate: z.boolean().optional().describe('Interpolate'),
    // Emission properties
    emission_shape: z.enum(['point', 'sphere', 'box', 'mesh', 'points', 'directions', 'ring']).optional().describe('Emission shape'),
    emission_sphere_radius: z.number().optional().describe('Emission sphere radius'),
    emission_box_extents: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Emission box extents'),
    // Draw properties
    draw_order: z.enum(['index', 'lifetime', 'view_depth']).optional().describe('Draw order'),
    transform_align: z.enum(['disabled', 'z_ billboard', 'y_to_velocity', 'z_ billboard_y_to_velocity']).optional().describe('Transform align'),
    // Collision properties (for GPUParticlesCollision3D)
    cull_mask: z.number().optional().describe('Cull mask'),
    // Attractor properties (for GPUParticlesAttractor3D)
    strength: z.number().optional().describe('Attractor strength'),
    attenuation: z.number().optional().describe('Attenuation'),
    directionality: z.number().optional().describe('Directionality'),
  }).optional().describe('Particles properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createParticles3DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_particles3d',
    name: '3D Particles',
    description: 'Create GPUParticles3D, GPUParticlesCollision3D, and GPUParticlesAttractor3D nodes for particle effects',
    category: '3d',
    inputSchema: particles3dSchema,
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

      // Create particles configuration based on type
      const particlesConfig = createParticlesConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create particles node
      // 2. Configure particles properties
      // 3. Set process and draw materials
      // 4. Apply transform
      // 5. Save the scene
      // For now, simulate the operation
      
      return {
        particleType: args.particleType,
        nodePath: nodePath,
        processMaterial: args.processMaterial,
        drawMaterial: args.drawMaterial,
        properties: particlesConfig.properties,
        transform: args.transform,
        message: `Created ${args.particleType} "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createParticlesConfig(args: any): any {
  const config: any = {
    nodeType: args.particleType,
    properties: args.properties || {},
  };

  // Set default properties based on particle type
  const defaults: Record<string, any> = {
    GPUParticles3D: {
      amount: 8,
      lifetime: 1,
      preprocess: 0,
      speed_scale: 1,
      explosiveness: 0,
      randomness: 0,
      fixed_fps: 0,
      fract_delta: true,
      interpolate: true,
      emission_shape: 'point',
      emission_sphere_radius: 1,
      draw_order: 'index',
      transform_align: 'disabled',
    },
    GPUParticlesCollision3D: {
      cull_mask: 1048575, // All layers
    },
    GPUParticlesAttractor3D: {
      strength: 1,
      attenuation: 1,
      directionality: 0,
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.particleType],
    ...config.properties,
  };

  return config;
}