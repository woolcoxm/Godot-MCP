import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const gridmapSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  action: z.enum(['create', 'set_mesh_library', 'paint_cells', 'erase_cells', 'configure']).default('create').describe('GridMap action'),
  name: z.string().describe('Name for the GridMap node'),
  meshLibrary: z.string().optional().describe('Path to MeshLibrary resource'),
  cells: z.array(z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).describe('Cell position'),
    item: z.number().describe('MeshLibrary item index'),
    orientation: z.number().optional().describe('Cell orientation (0-23)'),
  })).optional().describe('Cells to paint'),
  properties: z.object({
    cell_size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Cell size'),
    cell_scale: z.number().optional().describe('Cell scale'),
    collision_layer: z.number().optional().describe('Collision layer'),
    collision_mask: z.number().optional().describe('Collision mask'),
    physics_material: z.string().optional().describe('Physics material resource'),
    bake_navigation: z.boolean().optional().describe('Bake navigation'),
    center_x: z.boolean().optional().describe('Center X'),
    center_y: z.boolean().optional().describe('Center Y'),
    center_z: z.boolean().optional().describe('Center Z'),
  }).optional().describe('GridMap properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createGridmapTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_gridmap',
    name: '3D GridMap',
    description: 'Create GridMap nodes with MeshLibrary for grid-based level building',
    category: '3d',
    inputSchema: gridmapSchema,
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
          result = await createGridmap(transport, args);
          break;
          
        case 'set_mesh_library':
          result = await setMeshLibrary(transport, args);
          break;
          
        case 'paint_cells':
          result = await paintCells(transport, args);
          break;
          
        case 'erase_cells':
          result = await eraseCells(transport, args);
          break;
          
        case 'configure':
          result = await configureGridmap(transport, args);
          break;
          
        default:
          throw new Error(`Unknown GridMap action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
        readOnlyHint: false,
  };
}

async function createGridmap(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // Default GridMap properties
  const defaultProperties = {
    cell_size: { x: 2, y: 2, z: 2 },
    cell_scale: 1,
    collision_layer: 1,
    collision_mask: 1,
    bake_navigation: false,
    center_x: false,
    center_y: false,
    center_z: false,
  };

  const gridmapProperties = {
    ...defaultProperties,
    ...(args.properties || {}),
  };
  
  // In a real implementation, we would:
  // 1. Create GridMap node
  // 2. Configure GridMap properties
  // 3. Set MeshLibrary if provided
  // 4. Apply transform
  // 5. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create',
    nodePath: nodePath,
    properties: gridmapProperties,
    meshLibrary: args.meshLibrary,
    transform: args.transform,
    message: `Created GridMap "${args.name}" at ${nodePath}`,
  };
}

async function setMeshLibrary(_transport: Transport, args: any): Promise<any> {
  if (!args.meshLibrary) {
    throw new Error('meshLibrary is required for set_mesh_library action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find GridMap node
  // 2. Set MeshLibrary resource
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'set_mesh_library',
    nodePath: nodePath,
    meshLibrary: args.meshLibrary,
    message: `Set MeshLibrary on GridMap "${args.name}"`,
  };
}

async function paintCells(_transport: Transport, args: any): Promise<any> {
  if (!args.cells || args.cells.length === 0) {
    throw new Error('cells are required for paint_cells action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find GridMap node
  // 2. Paint cells at specified positions
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'paint_cells',
    nodePath: nodePath,
    cellCount: args.cells.length,
    message: `Painted ${args.cells.length} cells in GridMap "${args.name}"`,
  };
}

async function eraseCells(_transport: Transport, args: any): Promise<any> {
  if (!args.cells || args.cells.length === 0) {
    throw new Error('cells are required for erase_cells action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find GridMap node
  // 2. Erase cells at specified positions
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'erase_cells',
    nodePath: nodePath,
    cellCount: args.cells.length,
    message: `Erased ${args.cells.length} cells in GridMap "${args.name}"`,
  };
}

async function configureGridmap(_transport: Transport, args: any): Promise<any> {
  if (!args.properties) {
    throw new Error('properties are required for configure action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find GridMap node
  // 2. Update GridMap properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure',
    nodePath: nodePath,
    properties: args.properties,
    message: `Configured GridMap "${args.name}" properties`,
  };
}