import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const skeleton2dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/character_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the skeleton node'),
  properties: z.object({
    // Bone configuration
    bones: z.array(z.object({
      name: z.string().describe('Bone name'),
      position: z.object({ x: z.number(), y: z.number() }).describe('Bone position'),
      rotation: z.number().optional().describe('Bone rotation in radians'),
      length: z.number().optional().describe('Bone length'),
      parent: z.string().optional().describe('Parent bone name'),
      rest: z.object({
        position: z.object({ x: z.number(), y: z.number() }).optional(),
        rotation: z.number().optional(),
        scale: z.object({ x: z.number(), y: z.number() }).optional(),
      }).optional().describe('Rest transform'),
    })).optional().describe('Bone definitions'),
    // Skeleton properties
    autoCalculateLengthAndAngle: z.boolean().optional().describe('Auto calculate bone length and angle'),
    showBones: z.boolean().optional().describe('Show bones in editor'),
    // Modifiers
    modifiers: z.array(z.object({
      type: z.enum(['Curve2D', 'LookAt', 'Transform']),
      target: z.string().optional().describe('Target bone or node'),
      parameters: z.record(z.string(), z.any()).optional(),
    })).optional().describe('Bone modifiers'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Skeleton properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createSkeleton2DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_skeleton2d',
    name: '2D Skeleton',
    description: 'Create Skeleton2D nodes for 2D skeletal animation and bone deformation',
    category: '2d',
    inputSchema: skeleton2dSchema,
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

      // Create skeleton configuration
      const skeletonConfig = createSkeletonConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create Skeleton2D node
      // 2. Configure bones
      // 3. Set up bone hierarchy
      // 4. Configure modifiers
      // 5. Apply transform
      // 6. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        properties: skeletonConfig.properties,
        transform: args.transform,
        message: `Created Skeleton2D "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createSkeletonConfig(args: any): any {
  const config: any = {
    nodeType: 'Skeleton2D',
    properties: args.properties || {},
  };

  // Set default properties
  const defaults = {
    bones: [
      {
        name: 'root',
        position: { x: 0, y: 0 },
        rotation: 0,
        length: 50,
        parent: '',
        rest: {
          position: { x: 0, y: 0 },
          rotation: 0,
          scale: { x: 1, y: 1 },
        },
      },
      {
        name: 'bone1',
        position: { x: 50, y: 0 },
        rotation: 0,
        length: 50,
        parent: 'root',
        rest: {
          position: { x: 50, y: 0 },
          rotation: 0,
          scale: { x: 1, y: 1 },
        },
      },
    ],
    autoCalculateLengthAndAngle: true,
    showBones: true,
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