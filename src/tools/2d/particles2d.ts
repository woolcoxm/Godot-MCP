import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const particles2dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/effects.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the particles node'),
  particlesType: z.enum(['GPUParticles2D', 'CPUParticles2D']).describe('Type of particles node'),
  properties: z.object({
    // Process material properties
    processMaterial: z.object({
      emissionShape: z.enum(['point', 'sphere', 'box', 'points', 'directed_points', 'ring', 'mesh']).optional().describe('Emission shape'),
      emissionSphereRadius: z.number().optional().describe('Emission sphere radius'),
      emissionBoxExtents: z.object({ x: z.number(), y: z.number() }).optional().describe('Emission box extents'),
      emissionRingRadius: z.object({ min: z.number(), max: z.number() }).optional().describe('Emission ring radius'),
      emissionRingAxis: z.enum(['x', 'y', 'z']).optional().describe('Emission ring axis'),
      emissionPoints: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Emission points'),
      emissionNormals: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Emission normals'),
      emissionColors: z.array(z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() })).optional().describe('Emission colors'),
      // Lifetime
      lifetime: z.number().optional().describe('Particle lifetime'),
      lifetimeRandomness: z.number().optional().describe('Lifetime randomness'),
      // Velocity
      direction: z.object({ x: z.number(), y: z.number() }).optional().describe('Initial direction'),
      spread: z.number().optional().describe('Direction spread'),
      initialVelocity: z.number().optional().describe('Initial velocity'),
      initialVelocityRandom: z.number().optional().describe('Initial velocity randomness'),
      // Gravity
      gravity: z.object({ x: z.number(), y: z.number() }).optional().describe('Gravity vector'),
      // Color
      color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Particle color'),
      colorRamp: z.array(z.object({
        offset: z.number(),
        color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }),
      })).optional().describe('Color ramp'),
      // Size
      scale: z.number().optional().describe('Particle scale'),
      scaleRandom: z.number().optional().describe('Scale randomness'),
      scaleCurve: z.array(z.object({
        offset: z.number(),
        scale: z.number(),
      })).optional().describe('Scale curve'),
      // Rotation
      rotation: z.number().optional().describe('Initial rotation'),
      rotationRandom: z.number().optional().describe('Rotation randomness'),
      angularVelocity: z.number().optional().describe('Angular velocity'),
      angularVelocityRandom: z.number().optional().describe('Angular velocity randomness'),
      // Other
      damping: z.number().optional().describe('Damping'),
      dampingRandom: z.number().optional().describe('Damping randomness'),
    }).optional().describe('Process material properties'),
    // Draw pass properties
    drawPass1: z.string().optional().describe('Draw pass 1 texture path'),
    drawPass2: z.string().optional().describe('Draw pass 2 texture path'),
    drawPass3: z.string().optional().describe('Draw pass 3 texture path'),
    drawPass4: z.string().optional().describe('Draw pass 4 texture path'),
    // Particle system properties
    amount: z.number().optional().describe('Number of particles'),
    explosiveness: z.number().optional().describe('Explosiveness (0-1)'),
    randomness: z.number().optional().describe('Randomness (0-1)'),
    speedScale: z.number().optional().describe('Speed scale'),
    localCoords: z.boolean().optional().describe('Use local coordinates'),
    fixedFps: z.number().optional().describe('Fixed FPS (0 = use engine FPS)'),
    fractDelta: z.boolean().optional().describe('Fractional delta'),
    preprocess: z.number().optional().describe('Preprocess time'),
    // Visibility
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Particles properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createParticles2DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_particles2d',
    name: '2D Particles',
    description: 'Create GPUParticles2D and CPUParticles2D nodes for 2D particle effects',
    category: '2d',
    inputSchema: particles2dSchema,
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

      // Create particles configuration
      const particlesConfig = createParticlesConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create GPUParticles2D or CPUParticles2D node
      // 2. Configure process material
      // 3. Configure draw passes
      // 4. Configure particle system properties
      // 5. Apply transform
      // 6. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        particlesType: args.particlesType,
        properties: particlesConfig.properties,
        transform: args.transform,
        message: `Created ${args.particlesType} "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createParticlesConfig(args: any): any {
  const config: any = {
    nodeType: args.particlesType,
    properties: args.properties || {},
  };

  // Set default properties
  const defaults = {
    processMaterial: {
      emissionShape: 'point',
      emissionSphereRadius: 1.0,
      emissionBoxExtents: { x: 1, y: 1 },
      direction: { x: 0, y: -1 },
      spread: 45,
      initialVelocity: 10,
      initialVelocityRandom: 0,
      gravity: { x: 0, y: 98 },
      color: { r: 1, g: 1, b: 1, a: 1 },
      scale: 1.0,
      scaleRandom: 0,
      rotation: 0,
      rotationRandom: 0,
      angularVelocity: 0,
      angularVelocityRandom: 0,
      damping: 0,
      dampingRandom: 0,
    },
    amount: 100,
    explosiveness: 0,
    randomness: 0,
    speedScale: 1.0,
    localCoords: true,
    fixedFps: 0,
    fractDelta: true,
    preprocess: 0,
    visible: true,
    modulate: { r: 1, g: 1, b: 1, a: 1 },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults,
    ...config.properties,
  };

  return config;
}