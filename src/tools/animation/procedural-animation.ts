import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const proceduralAnimationSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/character.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the animation node'),
  type: z.enum(['spring', 'noise', 'sin', 'cos', 'lerp', 'slerp', 'bezier']).describe('Type of procedural animation'),
  properties: z.object({
    // Spring animation properties
    stiffness: z.number().optional().describe('Spring stiffness'),
    damping: z.number().optional().describe('Spring damping'),
    mass: z.number().optional().describe('Spring mass'),
    // Noise animation properties
    noiseType: z.enum(['simplex', 'perlin', 'cellular', 'value']).optional().describe('Noise type'),
    frequency: z.number().optional().describe('Noise frequency'),
    octaves: z.number().optional().describe('Noise octaves'),
    lacunarity: z.number().optional().describe('Noise lacunarity'),
    gain: z.number().optional().describe('Noise gain'),
    // Wave animation properties
    amplitude: z.number().optional().describe('Wave amplitude'),
    waveFrequency: z.number().optional().describe('Wave frequency'),
    phase: z.number().optional().describe('Wave phase'),
    offset: z.number().optional().describe('Wave offset'),
    // Interpolation properties
    duration: z.number().optional().describe('Animation duration'),
    easing: z.enum(['linear', 'in', 'out', 'inout', 'outin', 'elastic', 'bounce', 'back']).optional().describe('Easing function'),
    // Bezier curve properties
    controlPoints: z.array(z.object({
      x: z.number(),
      y: z.number(),
    })).optional().describe('Bezier control points'),
    // Target properties
    targetPath: z.string().optional().describe('Path to target node'),
    targetProperty: z.string().optional().describe('Target property name'),
    propertyType: z.enum(['position', 'rotation', 'scale', 'color', 'alpha', 'custom']).optional().describe('Property type'),
    // Range
    minValue: z.number().optional().describe('Minimum value'),
    maxValue: z.number().optional().describe('Maximum value'),
    // Timing
    loop: z.boolean().optional().describe('Loop animation'),
    pingpong: z.boolean().optional().describe('Ping-pong animation'),
    autoplay: z.boolean().optional().describe('Autoplay animation'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Procedural animation properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

const configureProceduralAnimationSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the procedural animation node'),
  properties: z.object({
    stiffness: z.number().optional().describe('Spring stiffness'),
    damping: z.number().optional().describe('Spring damping'),
    mass: z.number().optional().describe('Spring mass'),
    noiseType: z.enum(['simplex', 'perlin', 'cellular', 'value']).optional().describe('Noise type'),
    frequency: z.number().optional().describe('Noise frequency'),
    octaves: z.number().optional().describe('Noise octaves'),
    lacunarity: z.number().optional().describe('Noise lacunarity'),
    gain: z.number().optional().describe('Noise gain'),
    amplitude: z.number().optional().describe('Wave amplitude'),
    waveFrequency: z.number().optional().describe('Wave frequency'),
    phase: z.number().optional().describe('Wave phase'),
    offset: z.number().optional().describe('Wave offset'),
    duration: z.number().optional().describe('Animation duration'),
    easing: z.enum(['linear', 'in', 'out', 'inout', 'outin', 'elastic', 'bounce', 'back']).optional().describe('Easing function'),
    controlPoints: z.array(z.object({
      x: z.number(),
      y: z.number(),
    })).optional().describe('Bezier control points'),
    targetPath: z.string().optional().describe('Path to target node'),
    targetProperty: z.string().optional().describe('Target property name'),
    propertyType: z.enum(['position', 'rotation', 'scale', 'color', 'alpha', 'custom']).optional().describe('Property type'),
    minValue: z.number().optional().describe('Minimum value'),
    maxValue: z.number().optional().describe('Maximum value'),
    loop: z.boolean().optional().describe('Loop animation'),
    pingpong: z.boolean().optional().describe('Ping-pong animation'),
    autoplay: z.boolean().optional().describe('Autoplay animation'),
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Properties to update'),
});

const controlProceduralAnimationSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the procedural animation node'),
  action: z.enum(['play', 'pause', 'stop', 'reset', 'set_time', 'set_value']).describe('Action to perform'),
  time: z.number().optional().describe('Time to set (for set_time)'),
  value: z.number().optional().describe('Value to set (for set_value)'),
});

export function createProceduralAnimationTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_procedural_animation',
    name: 'ProceduralAnimation',
    description: 'Create and control procedural animation nodes',
    category: 'animation',
    destructiveHint: false,
    readOnlyHint: false,
    idempotentHint: true,
    inputSchema: z.object({
      operation: z.enum(['create', 'configure', 'control']).describe('Operation to perform'),
      data: z.record(z.string(), z.any()).describe('Operation data'),
    }),
    handler: async (args: any) => {
      const { operation, data } = args;
      
      switch (operation) {
        case 'create': {
          const validated = proceduralAnimationSchema.parse(data);
          
          // Determine node type based on animation type
          let nodeType = 'Node3D'; // Default
          if (validated.type === 'spring') {
            nodeType = 'SpringArm3D';
          }
          
          const op: TransportOperation = {
            type: 'create_node',
            data: {
              scenePath: validated.scenePath,
              parentPath: validated.parentPath,
              nodeType,
              name: validated.name,
              properties: validated.properties,
              transform: validated.transform,
            },
          };
          
          await transport.execute(op);
          return {
            content: [
              {
                type: 'text',
                text: `Created procedural animation node "${validated.name}" (${validated.type}) in scene "${validated.scenePath}"`,
              },
            ],
          };
        }
        
        case 'configure': {
          const validated = configureProceduralAnimationSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'modify_node',
            data: {
              scenePath: validated.scenePath,
              nodePath: validated.nodePath,
              properties: validated.properties,
            },
          };
          
          await transport.execute(op);
          return {
            content: [
              {
                type: 'text',
                text: `Configured procedural animation node at "${validated.nodePath}"`,
              },
            ],
          };
        }
        
        case 'control': {
          const validated = controlProceduralAnimationSchema.parse(data);
          
          let method = '';
          let args: any[] = [];
          
          switch (validated.action) {
            case 'play':
              method = 'play';
              break;
            case 'pause':
              method = 'pause';
              break;
            case 'stop':
              method = 'stop';
              break;
            case 'reset':
              method = 'reset';
              break;
            case 'set_time':
              method = 'set_time';
              args = [validated.time || 0];
              break;
            case 'set_value':
              method = 'set_value';
              args = [validated.value || 0];
              break;
          }
          
          const op: TransportOperation = {
            type: 'call_method',
            data: {
              scenePath: validated.scenePath,
              nodePath: validated.nodePath,
              method,
              args,
            },
          };
          
          await transport.execute(op);
          return {
            content: [
              {
                type: 'text',
                text: `${validated.action} performed on procedural animation node at "${validated.nodePath}"`,
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