import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const skeletonIKSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/character.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the SkeletonIK3D node'),
  properties: z.object({
    // SkeletonIK3D properties
    skeletonPath: z.string().describe('Path to the Skeleton3D node'),
    targetPath: z.string().describe('Path to the target node'),
    tipBone: z.string().describe('Name of the tip bone'),
    rootBone: z.string().describe('Name of the root bone'),
    interpolation: z.number().optional().describe('Interpolation speed'),
    targetNodeOrientation: z.boolean().optional().describe('Use target node orientation'),
    overrideTipBasis: z.boolean().optional().describe('Override tip bone basis'),
    useMagnet: z.boolean().optional().describe('Use magnet vector'),
    magnetPosition: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }).optional().describe('Magnet position'),
    minDistance: z.number().optional().describe('Minimum distance threshold'),
    maxIterations: z.number().optional().describe('Maximum iterations'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('SkeletonIK3D properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

const configureSkeletonIKSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the SkeletonIK3D node'),
  properties: z.object({
    skeletonPath: z.string().optional().describe('Path to the Skeleton3D node'),
    targetPath: z.string().optional().describe('Path to the target node'),
    tipBone: z.string().optional().describe('Name of the tip bone'),
    rootBone: z.string().optional().describe('Name of the root bone'),
    interpolation: z.number().optional().describe('Interpolation speed'),
    targetNodeOrientation: z.boolean().optional().describe('Use target node orientation'),
    overrideTipBasis: z.boolean().optional().describe('Override tip bone basis'),
    useMagnet: z.boolean().optional().describe('Use magnet vector'),
    magnetPosition: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }).optional().describe('Magnet position'),
    minDistance: z.number().optional().describe('Minimum distance threshold'),
    maxIterations: z.number().optional().describe('Maximum iterations'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Properties to update'),
});

const startStopSkeletonIKSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the SkeletonIK3D node'),
  action: z.enum(['start', 'stop']).describe('Action to perform'),
});

export function createSkeletonIKTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_skeleton_ik',
    name: 'SkeletonIK3D',
    description: 'Create and configure SkeletonIK3D nodes for inverse kinematics',
    category: 'animation',
    destructiveHint: false,
    readOnlyHint: false,
    idempotentHint: true,
    inputSchema: {
      operation: 'object',
      properties: {
        operation: {
          operation: 'string',
          enum: ['create', 'configure', 'start_stop'],
          description: 'Operation to perform',
        },
        params: {
          operation: 'object',
          description: 'Operation data',
        },
      },
      required: ['operation', 'data'],
    },
    handler: async (args: any) => {
      const { operation, data } = args;
      
      switch (operation) {
        case 'create': {
          const validated = skeletonIKSchema.parse(data);
          
          const op: TransportOperation = {
            operation: 'create_node',
            params: {
              scenePath: validated.scenePath,
              parentPath: validated.parentPath,
              nodeType: 'SkeletonIK3D',
              name: validated.name,
              properties: validated.properties,
              transform: validated.transform,
            },
          };
          
          const result = await transport.execute(op);
          return {
            content: [
              {
                operation: 'text',
                text: `Created SkeletonIK3D node "${validated.name}" in scene "${validated.scenePath}"`,
              },
            ],
          };
        }
        
        case 'configure': {
          const validated = configureSkeletonIKSchema.parse(data);
          
          const op: TransportOperation = {
            operation: 'modify_node',
            params: {
              scenePath: validated.scenePath,
              nodePath: validated.nodePath,
              properties: validated.properties,
            },
          };
          
          const result = await transport.execute(op);
          return {
            content: [
              {
                operation: 'text',
                text: `Configured SkeletonIK3D node at "${validated.nodePath}"`,
              },
            ],
          };
        }
        
        case 'start_stop': {
          const validated = startStopSkeletonIKSchema.parse(data);
          
          const op: TransportOperation = {
            operation: 'call_method',
            params: {
              scenePath: validated.scenePath,
              nodePath: validated.nodePath,
              method: validated.action === 'start' ? 'start' : 'stop',
              args: [],
            },
          };
          
          const result = await transport.execute(op);
          return {
            content: [
              {
                operation: 'text',
                text: `${validated.action === 'start' ? 'Started' : 'Stopped'} SkeletonIK3D at "${validated.nodePath}"`,
              },
            ],
          };
        }
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    },
  };
}