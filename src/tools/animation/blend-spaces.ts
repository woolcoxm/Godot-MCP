import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const blendSpaceSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/character.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the blend space node'),
  type: z.enum(['1d', '2d']).describe('Type of blend space (1D or 2D)'),
  properties: z.object({
    // BlendSpace1D/2D properties
    blendMode: z.enum(['interpolated', 'discrete']).optional().describe('Blend mode'),
    sync: z.boolean().optional().describe('Sync animations'),
    // For BlendSpace1D
    minSpace: z.number().optional().describe('Minimum space value (1D)'),
    maxSpace: z.number().optional().describe('Maximum space value (1D)'),
    snap: z.number().optional().describe('Snap value (1D)'),
    // For BlendSpace2D
    minSpaceX: z.number().optional().describe('Minimum X space value (2D)'),
    maxSpaceX: z.number().optional().describe('Maximum X space value (2D)'),
    minSpaceY: z.number().optional().describe('Minimum Y space value (2D)'),
    maxSpaceY: z.number().optional().describe('Maximum Y space value (2D)'),
    snapX: z.number().optional().describe('Snap X value (2D)'),
    snapY: z.number().optional().describe('Snap Y value (2D)'),
    // Blend points
    blendPoints: z.array(z.object({
      position: z.object({
        x: z.number().optional().describe('X position (for 2D) or value (for 1D)'),
        y: z.number().optional().describe('Y position (for 2D)'),
      }).describe('Position in blend space'),
      animation: z.string().describe('Animation name'),
      speed: z.number().optional().describe('Animation speed'),
      fromEnd: z.boolean().optional().describe('Play from end'),
    })).optional().describe('Blend points'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Blend space properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

const configureBlendSpaceSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the blend space node'),
  properties: z.object({
    blendMode: z.enum(['interpolated', 'discrete']).optional().describe('Blend mode'),
    sync: z.boolean().optional().describe('Sync animations'),
    minSpace: z.number().optional().describe('Minimum space value (1D)'),
    maxSpace: z.number().optional().describe('Maximum space value (1D)'),
    snap: z.number().optional().describe('Snap value (1D)'),
    minSpaceX: z.number().optional().describe('Minimum X space value (2D)'),
    maxSpaceX: z.number().optional().describe('Maximum X space value (2D)'),
    minSpaceY: z.number().optional().describe('Minimum Y space value (2D)'),
    maxSpaceY: z.number().optional().describe('Maximum Y space value (2D)'),
    snapX: z.number().optional().describe('Snap X value (2D)'),
    snapY: z.number().optional().describe('Snap Y value (2D)'),
    // Blend points
    blendPoints: z.array(z.object({
      position: z.object({
        x: z.number().optional().describe('X position (for 2D) or value (for 1D)'),
        y: z.number().optional().describe('Y position (for 2D)'),
      }).describe('Position in blend space'),
      animation: z.string().describe('Animation name'),
      speed: z.number().optional().describe('Animation speed'),
      fromEnd: z.boolean().optional().describe('Play from end'),
    })).optional().describe('Blend points'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Properties to update'),
});

const setBlendPositionSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the blend space node'),
  position: z.object({
    x: z.number().optional().describe('X position (for 2D) or value (for 1D)'),
    y: z.number().optional().describe('Y position (for 2D)'),
  }).describe('Blend position'),
});

export function createBlendSpacesTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_blend_spaces',
    name: 'BlendSpaces',
    description: 'Create and configure BlendSpace1D and BlendSpace2D nodes',
    category: 'animation',
    destructiveHint: false,
    readOnlyHint: false,
    idempotentHint: true,
    inputSchema: {
      operation: 'object',
      properties: {
        operation: {
          operation: 'string',
          enum: ['create', 'configure', 'set_position'],
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
          const validated = blendSpaceSchema.parse(data);
          
          const nodeType = validated.type === '1d' ? 'BlendSpace1D' : 'BlendSpace2D';
          
          const op: TransportOperation = {
            operation: 'create_node',
            params: {
              scenePath: validated.scenePath,
              parentPath: validated.parentPath,
              nodeType,
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
                text: `Created ${nodeType} node "${validated.name}" in scene "${validated.scenePath}"`,
              },
            ],
          };
        }
        
        case 'configure': {
          const validated = configureBlendSpaceSchema.parse(data);
          
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
                text: `Configured blend space node at "${validated.nodePath}"`,
              },
            ],
          };
        }
        
        case 'set_position': {
          const validated = setBlendPositionSchema.parse(data);
          
          const op: TransportOperation = {
            operation: 'call_method',
            params: {
              scenePath: validated.scenePath,
              nodePath: validated.nodePath,
              method: 'set_blend_position',
              args: [validated.position.x || 0, validated.position.y || 0],
            },
          };
          
          const result = await transport.execute(op);
          return {
            content: [
              {
                operation: 'text',
                text: `Set blend position to (${validated.position.x || 0}, ${validated.position.y || 0}) at "${validated.nodePath}"`,
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