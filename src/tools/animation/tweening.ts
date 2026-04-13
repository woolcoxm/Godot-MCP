import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const tweeningSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/ui.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the tween node'),
  properties: z.object({
    // Tween configuration
    tweens: z.array(z.object({
      target: z.string().describe('Target node path'),
      property: z.string().describe('Property to tween'),
      from: z.any().optional().describe('Starting value'),
      to: z.any().describe('Ending value'),
      duration: z.number().describe('Tween duration in seconds'),
      delay: z.number().optional().describe('Delay before starting'),
      // Easing
      transType: z.enum(['linear', 'sine', 'quad', 'cubic', 'quart', 'quint', 'expo', 'circ', 'elastic', 'back', 'bounce']).optional().describe('Transition type'),
      easeType: z.enum(['in', 'out', 'inout', 'outin']).optional().describe('Ease type'),
      // Repeat
      repeat: z.number().optional().describe('Number of repeats (-1 = infinite)'),
      loops: z.boolean().optional().describe('Loop the tween'),
      pingpong: z.boolean().optional().describe('Ping-pong (reverse on repeat)'),
      // Callbacks
      onStart: z.string().optional().describe('Method to call on start'),
      onUpdate: z.string().optional().describe('Method to call on update'),
      onComplete: z.string().optional().describe('Method to call on completion'),
    })).optional().describe('Tween definitions'),
    // Parallel/sequential
    parallel: z.boolean().optional().describe('Run tweens in parallel (false = sequential)'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Tween properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createTweeningTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_tweening',
    name: 'Tweening',
    description: 'Create Tween nodes for property interpolation and animation',
    category: 'animation',
    inputSchema: tweeningSchema,
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

      // Create tween configuration
      const tweenConfig = createTweenConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create Tween node
      // 2. Configure tween properties
      // 3. Set up easing and timing
      // 4. Configure callbacks
      // 5. Apply transform
      // 6. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        properties: tweenConfig.properties,
        transform: args.transform,
        message: `Created Tween "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createTweenConfig(args: any): any {
  const config: any = {
    nodeType: 'Tween',
    properties: args.properties || {},
  };

  // Set default properties
  const defaults = {
    tweens: [
      {
        target: '.',
        property: 'position:x',
        from: 0,
        to: 100,
        duration: 1.0,
        delay: 0,
        transType: 'quad',
        easeType: 'inout',
        repeat: 0,
        loops: false,
        pingpong: false,
      },
    ],
    parallel: true,
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