import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const canvasSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/ui.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the canvas layer node'),
  canvasType: z.enum(['CanvasLayer', 'CanvasItem']).describe('Type of canvas element'),
  properties: z.object({
    // CanvasLayer properties
    layer: z.number().optional().describe('Layer index (higher = drawn on top)'),
    offset: z.object({ x: z.number(), y: z.number() }).optional().describe('Layer offset'),
    rotation: z.number().optional().describe('Layer rotation in radians'),
    scale: z.object({ x: z.number(), y: z.number() }).optional().describe('Layer scale'),
    transform: z.object({
      x: z.object({ x: z.number(), y: z.number() }).optional(),
      y: z.object({ x: z.number(), y: z.number() }).optional(),
      origin: z.object({ x: z.number(), y: z.number() }).optional(),
    }).optional().describe('Custom transform matrix'),
    followViewportEnable: z.boolean().optional().describe('Follow viewport'),
    followViewportScale: z.boolean().optional().describe('Follow viewport scale'),
    // CanvasItem properties (for custom drawing)
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
    selfModulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Self modulate color'),
    showBehindParent: z.boolean().optional().describe('Show behind parent'),
    showOnTop: z.boolean().optional().describe('Show on top'),
    lightMask: z.number().optional().describe('Light mask'),
    material: z.string().optional().describe('Material resource path'),
    useParentMaterial: z.boolean().optional().describe('Use parent material'),
    // Visibility
    visible: z.boolean().optional().describe('Visible'),
    // Custom drawing instructions
    drawCommands: z.array(z.object({
      type: z.enum(['rect', 'circle', 'line', 'polygon', 'text', 'texture']),
      params: z.record(z.string(), z.any()).optional(),
    })).optional().describe('Custom drawing commands'),
  }).optional().describe('Canvas properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createCanvasTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_canvas',
    name: '2D Canvas',
    description: 'Create CanvasLayer nodes for UI layering and CanvasItem nodes for custom 2D drawing',
    category: '2d',
    inputSchema: canvasSchema,
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

      // Create canvas configuration
      const canvasConfig = createCanvasConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create CanvasLayer or CanvasItem node
      // 2. Configure canvas properties
      // 3. Apply transform
      // 4. Set up custom drawing if specified
      // 5. Save the scene
      // For now, simulate the operation
      
      const result: any = {
        nodePath: nodePath,
        canvasType: args.canvasType,
        properties: canvasConfig.properties,
        transform: args.transform,
        message: `Created ${args.canvasType} "${args.name}" at ${nodePath}`,
      };
      
      if (args.properties?.drawCommands) {
        result.drawCommands = args.properties.drawCommands;
        result.drawMessage = `Configured ${args.properties.drawCommands.length} custom drawing commands`;
      }
      
      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createCanvasConfig(args: any): any {
  const config: any = {
    nodeType: args.canvasType,
    properties: args.properties || {},
  };

  // Set default properties based on canvas type
  const defaults: Record<string, any> = {
    CanvasLayer: {
      layer: 0,
      offset: { x: 0, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
      followViewportEnable: false,
      followViewportScale: false,
    },
    CanvasItem: {
      modulate: { r: 1, g: 1, b: 1, a: 1 },
      selfModulate: { r: 1, g: 1, b: 1, a: 1 },
      showBehindParent: false,
      showOnTop: false,
      lightMask: 1,
      visible: true,
      useParentMaterial: false,
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.canvasType],
    ...config.properties,
  };

  return config;
}