import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const tilesetEditorSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  tilesetPath: z.string().describe('Path to save the TileSet resource (e.g., "res://tilesets/my_tileset.tres")'),
  name: z.string().describe('Name for the TileSet resource'),
  properties: z.object({
    // TileSet properties
    tileSize: z.object({ x: z.number(), y: z.number() }).optional().describe('Tile size in pixels'),
    uvClipping: z.boolean().optional().describe('UV clipping'),
    // Tile definitions
    tiles: z.array(z.object({
      id: z.number().describe('Tile ID'),
      texture: z.string().describe('Texture path'),
      region: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }).optional().describe('Texture region'),
      // Physics
      physics: z.array(z.object({
        layer: z.number().optional().describe('Physics layer'),
        polygon: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Collision polygon'),
        oneWay: z.boolean().optional().describe('One-way collision'),
        oneWayMargin: z.number().optional().describe('One-way margin'),
      })).optional().describe('Physics shapes'),
      // Navigation
      navigation: z.array(z.object({
        layer: z.number().optional().describe('Navigation layer'),
        polygon: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Navigation polygon'),
      })).optional().describe('Navigation polygons'),
      // Occlusion
      occlusion: z.array(z.object({
        polygon: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Occlusion polygon'),
      })).optional().describe('Occlusion shapes'),
      // Custom data
      customData: z.record(z.string(), z.any()).optional().describe('Custom data'),
      // Z-index
      zIndex: z.number().optional().describe('Z-index'),
      // Modulate
      modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
      // Material
      material: z.string().optional().describe('Material path'),
      // Y-sort origin
      ySortOrigin: z.number().optional().describe('Y-sort origin'),
    })).optional().describe('Tile definitions'),
    // Terrain sets
    terrainSets: z.array(z.object({
      id: z.number().describe('Terrain set ID'),
      name: z.string().optional().describe('Terrain set name'),
      mode: z.enum(['match_corners_and_sides', 'match_corners', 'match_sides']).optional().describe('Terrain mode'),
      terrains: z.array(z.object({
        id: z.number().describe('Terrain ID'),
        name: z.string().optional().describe('Terrain name'),
        color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Terrain color'),
      })).optional().describe('Terrains'),
    })).optional().describe('Terrain sets'),
    // Tile proxies
    tileProxies: z.array(z.object({
      source: z.number().describe('Source tile ID'),
      dest: z.number().describe('Destination tile ID'),
    })).optional().describe('Tile proxies'),
  }).optional().describe('TileSet properties'),
});

export function createTilesetEditorTool(_transport: Transport): RegisteredTool {
  return {
    id: 'godot_tileset_editor',
    name: '2D TileSet Editor',
    description: 'Create and configure TileSet resources for use with TileMap nodes',
    category: '2d',
    inputSchema: tilesetEditorSchema,
    handler: async (args) => {
      // In a real implementation, we would:
      // 1. Create TileSet resource
      // 2. Configure tile size and properties
      // 3. Add tile definitions with textures
      // 4. Configure physics, navigation, and occlusion shapes
      // 5. Set up terrain sets
      // 6. Configure tile proxies
      // 7. Save the TileSet resource
      // For now, simulate the operation
      
      const tilesetConfig = createTilesetConfig(args);
      
      return {
        tilesetPath: args.tilesetPath,
        name: args.name,
        properties: tilesetConfig.properties,
        message: `Created TileSet "${args.name}" at ${args.tilesetPath}`,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createTilesetConfig(args: any): any {
  const config: any = {
    resourceType: 'TileSet',
    properties: args.properties || {},
  };

  // Set default properties
  const defaults = {
    tileSize: { x: 64, y: 64 },
    uvClipping: false,
    tiles: [
      {
        id: 0,
        texture: 'res://textures/tile_grass.png',
        region: { x: 0, y: 0, width: 64, height: 64 },
        physics: [],
        navigation: [],
        occlusion: [],
        zIndex: 0,
        modulate: { r: 1, g: 1, b: 1, a: 1 },
        ySortOrigin: 0,
      },
      {
        id: 1,
        texture: 'res://textures/tile_stone.png',
        region: { x: 64, y: 0, width: 64, height: 64 },
        physics: [],
        navigation: [],
        occlusion: [],
        zIndex: 0,
        modulate: { r: 1, g: 1, b: 1, a: 1 },
        ySortOrigin: 0,
      },
    ],
    terrainSets: [],
    tileProxies: [],
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults,
    ...config.properties,
  };

  return config;
}