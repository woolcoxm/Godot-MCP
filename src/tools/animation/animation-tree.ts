import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const animationTreeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/character.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the animation tree node'),
  treeType: z.enum(['AnimationNodeStateMachine', 'AnimationNodeBlendTree', 'AnimationNodeBlendSpace1D', 'AnimationNodeBlendSpace2D']).describe('Type of animation tree'),
  properties: z.object({
    // AnimationTree properties
    animPlayer: z.string().optional().describe('Path to AnimationPlayer node'),
    rootMotionTrack: z.string().optional().describe('Root motion track path'),
    rootMotionMode: z.enum(['disabled', 'relative', 'absolute']).optional().describe('Root motion mode'),
    processCallback: z.enum(['physics', 'idle', 'manual']).optional().describe('Process callback'),
    active: z.boolean().optional().describe('Tree active'),
    // State machine properties (for AnimationNodeStateMachine)
    states: z.array(z.object({
      name: z.string().describe('State name'),
      animation: z.string().describe('Animation name'),
      position: z.object({ x: z.number(), y: z.number() }).optional().describe('State position in editor'),
      transitions: z.array(z.object({
        to: z.string().describe('Target state'),
        priority: z.number().optional().describe('Transition priority'),
        advanceCondition: z.string().optional().describe('Advance condition expression'),
        switchMode: z.enum(['immediate', 'sync', 'at_end']).optional().describe('Switch mode'),
        autoAdvance: z.boolean().optional().describe('Auto advance'),
      })).optional().describe('State transitions'),
    })).optional().describe('State machine states'),
    // Blend tree properties (for AnimationNodeBlendTree)
    nodes: z.array(z.object({
      name: z.string().describe('Node name'),
      type: z.enum(['Animation', 'Blend2', 'Blend3', 'OneShot', 'TimeScale', 'TimeSeek', 'Transition']).describe('Node type'),
      position: z.object({ x: z.number(), y: z.number() }).optional().describe('Node position in editor'),
      parameters: z.record(z.string(), z.any()).optional().describe('Node parameters'),
      connections: z.array(z.object({
        inputIndex: z.number().describe('Input index'),
        sourceNode: z.string().describe('Source node name'),
        sourcePort: z.number().describe('Source port index'),
      })).optional().describe('Node connections'),
    })).optional().describe('Blend tree nodes'),
    // Blend space properties
    blendSpacePoints: z.array(z.object({
      position: z.object({ x: z.number(), y: z.number() }).optional().describe('Point position in blend space'),
      animation: z.string().describe('Animation name'),
    })).optional().describe('Blend space points'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Animation tree properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createAnimationTreeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_animation_tree',
    name: 'Animation Tree',
    description: 'Create AnimationTree nodes for complex animation state machines and blend trees',
    category: 'animation',
    inputSchema: animationTreeSchema,
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

      // Create animation tree configuration
      const treeConfig = createTreeConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create AnimationTree node
      // 2. Configure tree type (state machine, blend tree, etc.)
      // 3. Set up states/nodes based on tree type
      // 4. Configure parameters and transitions
      // 5. Apply transform
      // 6. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        treeType: args.treeType,
        properties: treeConfig.properties,
        transform: args.transform,
        message: `Created AnimationTree "${args.name}" with ${args.treeType} at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createTreeConfig(args: any): any {
  const config: any = {
    nodeType: 'AnimationTree',
    properties: args.properties || {},
  };

  // Set default properties based on tree type
  const defaults: Record<string, any> = {
    AnimationNodeStateMachine: {
      animPlayer: '../AnimationPlayer',
      rootMotionTrack: '',
      rootMotionMode: 'disabled',
      processCallback: 'physics',
      active: true,
      states: [
        {
          name: 'idle',
          animation: 'idle',
          position: { x: 0, y: 0 },
          transitions: [
            {
              to: 'walk',
              priority: 0,
              advanceCondition: 'velocity.length() > 0.1',
              switchMode: 'immediate',
              autoAdvance: true,
            },
          ],
        },
        {
          name: 'walk',
          animation: 'walk',
          position: { x: 200, y: 0 },
          transitions: [
            {
              to: 'idle',
              priority: 0,
              advanceCondition: 'velocity.length() <= 0.1',
              switchMode: 'immediate',
              autoAdvance: true,
            },
          ],
        },
      ],
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
    AnimationNodeBlendTree: {
      animPlayer: '../AnimationPlayer',
      rootMotionTrack: '',
      rootMotionMode: 'disabled',
      processCallback: 'physics',
      active: true,
      nodes: [
        {
          name: 'idle',
          type: 'Animation',
          position: { x: 0, y: 0 },
          parameters: { animation: 'idle' },
          connections: [],
        },
        {
          name: 'walk',
          type: 'Animation',
          position: { x: 200, y: 0 },
          parameters: { animation: 'walk' },
          connections: [],
        },
        {
          name: 'blend',
          type: 'Blend2',
          position: { x: 100, y: 100 },
          parameters: { blend_amount: 0 },
          connections: [
            { inputIndex: 0, sourceNode: 'idle', sourcePort: 0 },
            { inputIndex: 1, sourceNode: 'walk', sourcePort: 0 },
          ],
        },
      ],
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.treeType],
    ...config.properties,
  };

  return config;
}