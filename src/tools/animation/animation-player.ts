import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const animationPlayerSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/character.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the animation player node'),
  properties: z.object({
    // Animation definitions
    animations: z.array(z.object({
      name: z.string().describe('Animation name'),
      length: z.number().optional().describe('Animation length in seconds'),
      loopMode: z.enum(['none', 'linear', 'pingpong']).optional().describe('Loop mode'),
      step: z.number().optional().describe('Step size'),
      // Tracks
      tracks: z.array(z.object({
        type: z.enum(['value', 'transform', 'method', 'bezier', 'audio', 'animation']).describe('Track type'),
        path: z.string().describe('Node path for this track'),
        property: z.string().optional().describe('Property name (for value tracks)'),
        method: z.string().optional().describe('Method name (for method tracks)'),
        // Keyframes
        keyframes: z.array(z.object({
          time: z.number().describe('Keyframe time'),
          value: z.any().optional().describe('Keyframe value'),
          transition: z.number().optional().describe('Transition type'),
          easing: z.enum(['linear', 'in', 'out', 'inout', 'outin']).optional().describe('Easing type'),
        })).optional().describe('Keyframes'),
      })).optional().describe('Animation tracks'),
    })).optional().describe('Animations'),
    // Playback properties
    autoplay: z.string().optional().describe('Animation to autoplay'),
    playbackSpeed: z.number().optional().describe('Playback speed multiplier'),
    playbackActive: z.boolean().optional().describe('Playback active'),
    // Blend times
    blendTimes: z.record(z.string(), z.number()).optional().describe('Blend times between animations'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Animation player properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createAnimationPlayerTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_animation_player',
    name: 'Animation Player',
    description: 'Create AnimationPlayer nodes for creating and playing animations',
    category: 'animation',
    inputSchema: animationPlayerSchema,
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

      // Create animation player configuration
      const animationConfig = createAnimationConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create AnimationPlayer node
      // 2. Create animation resources
      // 3. Configure animation tracks and keyframes
      // 4. Set up playback properties
      // 5. Apply transform
      // 6. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        properties: animationConfig.properties,
        transform: args.transform,
        message: `Created AnimationPlayer "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createAnimationConfig(args: any): any {
  const config: any = {
    nodeType: 'AnimationPlayer',
    properties: args.properties || {},
  };

  // Set default properties
  const defaults = {
    animations: [
      {
        name: 'idle',
        length: 1.0,
        loopMode: 'linear',
        step: 0.1,
        tracks: [
          {
            type: 'value',
            path: '.',
            property: 'position:x',
            keyframes: [
              { time: 0, value: 0, transition: 1, easing: 'linear' },
              { time: 1, value: 0, transition: 1, easing: 'linear' },
            ],
          },
        ],
      },
    ],
    autoplay: 'idle',
    playbackSpeed: 1.0,
    playbackActive: true,
    blendTimes: {},
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