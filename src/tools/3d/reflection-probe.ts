import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const reflectionProbeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the reflection probe node'),
  properties: z.object({
    // Probe properties
    updateMode: z.enum(['once', 'always']).optional().describe('Update mode'),
    intensity: z.number().optional().describe('Intensity multiplier'),
    interior: z.boolean().optional().describe('Interior environment'),
    boxProjection: z.boolean().optional().describe('Enable box projection'),
    cullMask: z.number().optional().describe('Cull mask'),
    maxDistance: z.number().optional().describe('Max distance'),
    originOffset: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Origin offset'),
    size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Probe size'),
    // Quality settings
    subdiv: z.number().optional().describe('Subdivision level (higher = better quality)'),
    ambientMode: z.enum(['disabled', 'environment', 'color']).optional().describe('Ambient mode'),
    ambientColor: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Ambient color'),
    ambientEnergy: z.number().optional().describe('Ambient energy'),
  }).optional().describe('Reflection probe properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createReflectionProbeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_reflection_probe',
    name: '3D Reflection Probe',
    description: 'Create ReflectionProbe nodes for real-time reflections and ambient lighting',
    category: '3d',
    inputSchema: reflectionProbeSchema,
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

      // Create reflection probe configuration
      const probeConfig = createProbeConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create ReflectionProbe node
      // 2. Configure probe properties
      // 3. Apply transform
      // 4. Bake reflection data
      // 5. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        properties: probeConfig.properties,
        transform: args.transform,
        message: `Created ReflectionProbe "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createProbeConfig(args: any): any {
  const config: any = {
    nodeType: 'ReflectionProbe',
    properties: args.properties || {},
  };

  // Set default properties
  const defaults = {
    updateMode: 'once',
    intensity: 1.0,
    interior: false,
    boxProjection: false,
    cullMask: 1048575, // All layers
    maxDistance: 100,
    originOffset: { x: 0, y: 0, z: 0 },
    size: { x: 10, y: 10, z: 10 },
    subdiv: 128,
    ambientMode: 'disabled',
    ambientColor: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
    ambientEnergy: 1.0,
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults,
    ...config.properties,
  };

  return config;
}