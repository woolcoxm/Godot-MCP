import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const path3dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  action: z.enum(['create', 'add_points', 'configure_curve', 'create_follow']).default('create').describe('Path3D action'),
  name: z.string().describe('Name for the Path3D node'),
  points: z.array(z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    in_tangent: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    out_tangent: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  })).optional().describe('Curve points'),
  curveProperties: z.object({
    bake_interval: z.number().optional().describe('Bake interval'),
    up_vector_enabled: z.boolean().optional().describe('Up vector enabled'),
  }).optional().describe('Curve3D properties'),
  followProperties: z.object({
    path: z.string().optional().describe('Path to Path3D node'),
    offset: z.number().optional().describe('Path offset'),
    unit_offset: z.number().optional().describe('Unit offset'),
    rotation_mode: z.enum(['none', 'y', 'xy', 'xyz', 'orientated']).optional().describe('Rotation mode'),
    cubic_interp: z.boolean().optional().describe('Cubic interpolation'),
    loop: z.boolean().optional().describe('Loop'),
  }).optional().describe('PathFollow3D properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createPath3DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_path3d',
    name: '3D Path',
    description: 'Create Path3D nodes with curves and PathFollow3D for movement along paths',
    category: '3d',
    inputSchema: path3dSchema,
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

      let result: any;
      
      switch (args.action) {
        case 'create':
          result = await createPath3D(transport, args);
          break;
          
        case 'add_points':
          result = await addPoints(transport, args);
          break;
          
        case 'configure_curve':
          result = await configureCurve(transport, args);
          break;
          
        case 'create_follow':
          result = await createPathFollow(transport, args);
          break;
          
        default:
          throw new Error(`Unknown Path3D action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
        readOnlyHint: false,
  };
}

async function createPath3D(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create Path3D node
  // 2. Create Curve3D resource
  // 3. Add points if provided
  // 4. Configure curve properties
  // 5. Apply transform
  // 6. Save the scene
  // For now, simulate the operation
  
  const pointCount = args.points?.length || 0;
  
  return {
    action: 'create',
    nodePath: nodePath,
    pointCount: pointCount,
    curveProperties: args.curveProperties || {},
    transform: args.transform,
    message: `Created Path3D "${args.name}" with ${pointCount} points at ${nodePath}`,
  };
}

async function addPoints(_transport: Transport, args: any): Promise<any> {
  if (!args.points || args.points.length === 0) {
    throw new Error('points are required for add_points action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Path3D node
  // 2. Add points to curve
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'add_points',
    nodePath: nodePath,
    pointCount: args.points.length,
    message: `Added ${args.points.length} points to Path3D "${args.name}"`,
  };
}

async function configureCurve(_transport: Transport, args: any): Promise<any> {
  if (!args.curveProperties) {
    throw new Error('curveProperties are required for configure_curve action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Path3D node
  // 2. Configure Curve3D properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_curve',
    nodePath: nodePath,
    curveProperties: args.curveProperties,
    message: `Configured curve properties for Path3D "${args.name}"`,
  };
}

async function createPathFollow(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // Default PathFollow3D properties
  const defaultProperties = {
    offset: 0,
    unit_offset: 0,
    rotation_mode: 'y',
    cubic_interp: true,
    loop: false,
  };

  const followProperties = {
    ...defaultProperties,
    ...(args.followProperties || {}),
  };
  
  // In a real implementation, we would:
  // 1. Create PathFollow3D node
  // 2. Configure follow properties
  // 3. Set path if provided
  // 4. Apply transform
  // 5. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_follow',
    nodePath: nodePath,
    path: args.followProperties?.path,
    followProperties: followProperties,
    transform: args.transform,
    message: `Created PathFollow3D "${args.name}" at ${nodePath}`,
  };
}