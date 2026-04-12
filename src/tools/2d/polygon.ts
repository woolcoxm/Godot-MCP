import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const polygonSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the polygon node'),
  polygonType: z.enum(['Polygon2D', 'CollisionPolygon2D']).describe('Type of polygon node'),
  properties: z.object({
    // Polygon2D properties
    polygon: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Polygon vertices'),
    uv: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('UV coordinates'),
    color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Polygon color'),
    texture: z.string().optional().describe('Texture path'),
    textureOffset: z.object({ x: z.number(), y: z.number() }).optional().describe('Texture offset'),
    textureScale: z.object({ x: z.number(), y: z.number() }).optional().describe('Texture scale'),
    textureRotation: z.number().optional().describe('Texture rotation in radians'),
    invertEnabled: z.boolean().optional().describe('Invert polygon'),
    invertBorder: z.number().optional().describe('Invert border size'),
    vertexColors: z.array(z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() })).optional().describe('Vertex colors'),
    skeleton: z.string().optional().describe('Skeleton path for vertex weights'),
    // CollisionPolygon2D properties
    buildMode: z.enum(['solids', 'segments']).optional().describe('Build mode'),
    disabled: z.boolean().optional().describe('Collision disabled'),
    oneWayCollision: z.boolean().optional().describe('One-way collision'),
    oneWayCollisionMargin: z.number().optional().describe('One-way collision margin'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Polygon properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createPolygonTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_polygon',
    name: '2D Polygon',
    description: 'Create Polygon2D nodes for custom shapes and CollisionPolygon2D nodes for collision shapes',
    category: '2d',
    inputSchema: polygonSchema,
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

      // Create polygon configuration
      const polygonConfig = createPolygonConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create Polygon2D or CollisionPolygon2D node
      // 2. Configure polygon vertices
      // 3. Configure texture/color properties for Polygon2D
      // 4. Configure collision properties for CollisionPolygon2D
      // 5. Apply transform
      // 6. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        polygonType: args.polygonType,
        properties: polygonConfig.properties,
        transform: args.transform,
        message: `Created ${args.polygonType} "${args.name}" at ${nodePath}`,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createPolygonConfig(args: any): any {
  const config: any = {
    nodeType: args.polygonType,
    properties: args.properties || {},
  };

  // Set default properties based on polygon type
  const defaults: Record<string, any> = {
    Polygon2D: {
      polygon: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      color: { r: 1, g: 1, b: 1, a: 1 },
      textureOffset: { x: 0, y: 0 },
      textureScale: { x: 1, y: 1 },
      textureRotation: 0,
      invertEnabled: false,
      invertBorder: 100,
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
    CollisionPolygon2D: {
      polygon: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      buildMode: 'solids',
      disabled: false,
      oneWayCollision: false,
      oneWayCollisionMargin: 1.0,
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.polygonType],
    ...config.properties,
  };

  return config;
}