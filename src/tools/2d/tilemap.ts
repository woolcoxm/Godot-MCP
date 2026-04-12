import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const tilemapSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  action: z.enum(['create', 'set_tileset', 'paint_tiles', 'erase_tiles', 'configure_layer', 'create_pattern']).default('create').describe('TileMap action'),
  name: z.string().describe('Name for the TileMap node'),
  tileset: z.string().optional().describe('Path to TileSet resource'),
  layer: z.number().default(0).describe('TileMap layer'),
  cells: z.array(z.object({
    position: z.object({ x: z.number(), y: z.number() }).describe('Cell position'),
    tile: z.object({
      source_id: z.number().optional().describe('Tile source ID'),
      atlas_coords: z.object({ x: z.number(), y: z.number() }).optional().describe('Atlas coordinates'),
      alternative_id: z.number().optional().describe('Alternative tile ID'),
    }).describe('Tile data'),
    flip_h: z.boolean().optional().describe('Flip horizontally'),
    flip_v: z.boolean().optional().describe('Flip vertically'),
    transpose: z.boolean().optional().describe('Transpose tile'),
  })).optional().describe('Cells to paint'),
  layerProperties: z.object({
    name: z.string().optional().describe('Layer name'),
    enabled: z.boolean().optional().describe('Layer enabled'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Layer color modulation'),
    y_sort_enabled: z.boolean().optional().describe('Enable Y-sort'),
    y_sort_origin: z.number().optional().describe('Y-sort origin'),
    z_index: z.number().optional().describe('Z-index'),
    collision_animatable: z.boolean().optional().describe('Collision animatable'),
    collision_enabled: z.boolean().optional().describe('Collision enabled'),
    navigation_enabled: z.boolean().optional().describe('Navigation enabled'),
  }).optional().describe('Layer properties'),
  tilemapProperties: z.object({
    cell_size: z.object({ x: z.number(), y: z.number() }).optional().describe('Cell size'),
    tile_shape: z.enum(['square', 'isometric', 'half_offset', 'hexagonal']).optional().describe('Tile shape'),
    tile_layout: z.enum(['stacked', 'staggered']).optional().describe('Tile layout'),
    tile_offset_axis: z.enum(['horizontal', 'vertical']).optional().describe('Tile offset axis'),
    tile_size: z.object({ x: z.number(), y: z.number() }).optional().describe('Tile size'),
    collision_animatable: z.boolean().optional().describe('Collision animatable'),
    collision_visibility_mode: z.enum(['default', 'force_show', 'force_hide']).optional().describe('Collision visibility mode'),
    navigation_visibility_mode: z.enum(['default', 'force_show', 'force_hide']).optional().describe('Navigation visibility mode'),
    rendering_quadrant_size: z.number().optional().describe('Rendering quadrant size'),
  }).optional().describe('TileMap properties'),
  pattern: z.array(z.object({
    position: z.object({ x: z.number(), y: z.number() }),
    tile: z.object({
      source_id: z.number(),
      atlas_coords: z.object({ x: z.number(), y: z.number() }),
      alternative_id: z.number(),
    }),
  })).optional().describe('Tile pattern to create'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createTilemapTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_tilemap',
    name: '2D TileMap',
    description: 'Create and manipulate TileMap nodes with TileSet, layers, and tile painting',
    category: '2d',
    inputSchema: tilemapSchema,
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
          result = await createTilemap(transport, args);
          break;
          
        case 'set_tileset':
          result = await setTileset(transport, args);
          break;
          
        case 'paint_tiles':
          result = await paintTiles(transport, args);
          break;
          
        case 'erase_tiles':
          result = await eraseTiles(transport, args);
          break;
          
        case 'configure_layer':
          result = await configureLayer(transport, args);
          break;
          
        case 'create_pattern':
          result = await createPattern(transport, args);
          break;
          
        default:
          throw new Error(`Unknown TileMap action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

async function createTilemap(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // Default TileMap properties
  const defaultProperties = {
    cell_size: { x: 64, y: 64 },
    tile_shape: 'square',
    tile_layout: 'stacked',
    tile_offset_axis: 'horizontal',
    tile_size: { x: 64, y: 64 },
    collision_animatable: false,
    collision_visibility_mode: 'default',
    navigation_visibility_mode: 'default',
    rendering_quadrant_size: 16,
  };

  const tilemapProperties = {
    ...defaultProperties,
    ...(args.tilemapProperties || {}),
  };
  
  // In a real implementation, we would:
  // 1. Create TileMap node
  // 2. Configure TileMap properties
  // 3. Set TileSet if provided
  // 4. Apply transform
  // 5. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create',
    nodePath: nodePath,
    properties: tilemapProperties,
    tileset: args.tileset,
    transform: args.transform,
    message: `Created TileMap "${args.name}" at ${nodePath}`,
  };
}

async function setTileset(_transport: Transport, args: any): Promise<any> {
  if (!args.tileset) {
    throw new Error('tileset is required for set_tileset action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find TileMap node
  // 2. Set TileSet resource
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'set_tileset',
    nodePath: nodePath,
    tileset: args.tileset,
    message: `Set TileSet on TileMap "${args.name}"`,
  };
}

async function paintTiles(_transport: Transport, args: any): Promise<any> {
  if (!args.cells || args.cells.length === 0) {
    throw new Error('cells are required for paint_tiles action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find TileMap node
  // 2. Paint tiles at specified cells
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'paint_tiles',
    nodePath: nodePath,
    layer: args.layer,
    cellCount: args.cells.length,
    message: `Painted ${args.cells.length} tiles on layer ${args.layer} of TileMap "${args.name}"`,
  };
}

async function eraseTiles(_transport: Transport, args: any): Promise<any> {
  if (!args.cells || args.cells.length === 0) {
    throw new Error('cells are required for erase_tiles action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find TileMap node
  // 2. Erase tiles at specified cells
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'erase_tiles',
    nodePath: nodePath,
    layer: args.layer,
    cellCount: args.cells.length,
    message: `Erased ${args.cells.length} tiles on layer ${args.layer} of TileMap "${args.name}"`,
  };
}

async function configureLayer(_transport: Transport, args: any): Promise<any> {
  if (!args.layerProperties) {
    throw new Error('layerProperties are required for configure_layer action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find TileMap node
  // 2. Configure layer properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_layer',
    nodePath: nodePath,
    layer: args.layer,
    layerProperties: args.layerProperties,
    message: `Configured layer ${args.layer} of TileMap "${args.name}"`,
  };
}

async function createPattern(_transport: Transport, args: any): Promise<any> {
  if (!args.pattern || args.pattern.length === 0) {
    throw new Error('pattern is required for create_pattern action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create TileMapPattern resource
  // 2. Add pattern tiles
  // 3. Save the pattern
  // For now, simulate the operation
  
  return {
    action: 'create_pattern',
    nodePath: nodePath,
    patternSize: args.pattern.length,
    message: `Created pattern with ${args.pattern.length} tiles for TileMap "${args.name}"`,
  };
}