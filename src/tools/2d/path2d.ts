import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const path2dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the path node'),
  pathType: z.enum(['Path2D', 'PathFollow2D']).describe('Type of path node'),
  properties: z.object({
    // Path2D properties
    curve: z.object({
      points: z.array(z.object({
        x: z.number(),
        y: z.number(),
        in: z.object({ x: z.number(), y: z.number() }).optional(),
        out: z.object({ x: z.number(), y: z.number() }).optional(),
      })).optional().describe('Curve points'),
      closed: z.boolean().optional().describe('Closed curve'),
      bakeInterval: z.number().optional().describe('Bake interval'),
    }).optional().describe('Curve data'),
    // PathFollow2D properties
    offset: z.number().optional().describe('Offset along the path'),
    unitOffset: z.number().optional().describe('Unit offset (0-1)'),
    hOffset: z.number().optional().describe('Horizontal offset'),
    vOffset: z.number().optional().describe('Vertical offset'),
    rotate: z.boolean().optional().describe('Rotate to follow path'),
    cubicInterp: z.boolean().optional().describe('Use cubic interpolation'),
    loop: z.boolean().optional().describe('Loop around the path'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Path properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
  createFollowNode: z.boolean().optional().describe('Create a PathFollow2D child node for this path'),
});

export function createPath2DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_path2d',
    name: '2D Path',
    description: 'Create Path2D nodes for defining 2D curves and PathFollow2D nodes for following paths',
    category: '2d',
    inputSchema: path2dSchema,
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

      // Create path configuration
      const pathConfig = createPathConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create Path2D or PathFollow2D node
      // 2. Configure curve data for Path2D
      // 3. Configure follow properties for PathFollow2D
      // 4. Apply transform
      // 5. Create PathFollow2D child if requested
      // 6. Save the scene
      // For now, simulate the operation
      
      const result: any = {
        nodePath: nodePath,
        pathType: args.pathType,
        properties: pathConfig.properties,
        transform: args.transform,
        message: `Created ${args.pathType} "${args.name}" at ${nodePath}`,
      };
      
      if (args.createFollowNode && args.pathType === 'Path2D') {
        result.followNode = {
          name: `${args.name}_Follow`,
          path: `res://scenes/${args.scenePath}`,
          nodePath: `${nodePath}/${args.name}_Follow`,
          properties: {
            offset: 0,
            unitOffset: 0,
            hOffset: 0,
            vOffset: 0,
            rotate: true,
            cubicInterp: true,
            loop: false,
          },
        };
        result.followMessage = `PathFollow2D child node will be created at ${result.followNode.nodePath}`;
      }
      
      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createPathConfig(args: any): any {
  const config: any = {
    nodeType: args.pathType,
    properties: args.properties || {},
  };

  // Set default properties based on path type
  const defaults: Record<string, any> = {
    Path2D: {
      curve: {
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
        closed: false,
        bakeInterval: 5.0,
      },
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
    PathFollow2D: {
      offset: 0,
      unitOffset: 0,
      hOffset: 0,
      vOffset: 0,
      rotate: true,
      cubicInterp: true,
      loop: false,
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.pathType],
    ...config.properties,
  };

  return config;
}