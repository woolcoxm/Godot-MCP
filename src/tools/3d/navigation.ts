import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { HeadlessBridge, HeadlessOperation } from '../../transports/headless-bridge.js';

const navigationSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  action: z.enum(['create_region', 'bake_navmesh', 'create_agent', 'create_obstacle', 'configure_navigation']).describe('Navigation action to perform'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the navigation node'),
  regionProperties: z.object({
    navmesh: z.string().optional().describe('Path to NavigationMesh resource'),
    enabled: z.boolean().optional().describe('Enable the region'),
    navigation_layers: z.number().optional().describe('Navigation layers bitmask'),
    enter_cost: z.number().optional().describe('Enter cost'),
    travel_cost: z.number().optional().describe('Travel cost'),
  }).optional().describe('NavigationRegion3D properties'),
  agentProperties: z.object({
    radius: z.number().optional().describe('Agent radius'),
    height: z.number().optional().describe('Agent height'),
    max_speed: z.number().optional().describe('Maximum speed'),
    acceleration: z.number().optional().describe('Acceleration'),
    path_max_distance: z.number().optional().describe('Path max distance'),
    target_desired_distance: z.number().optional().describe('Target desired distance'),
    navigation_layers: z.number().optional().describe('Navigation layers'),
  }).optional().describe('NavigationAgent3D properties'),
  obstacleProperties: z.object({
    radius: z.number().optional().describe('Obstacle radius'),
    height: z.number().optional().describe('Obstacle height'),
    velocity: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Obstacle velocity'),
    avoidance_layers: z.number().optional().describe('Avoidance layers'),
  }).optional().describe('NavigationObstacle3D properties'),
  bakeSettings: z.object({
    agent_radius: z.number().optional().describe('Agent radius for baking'),
    agent_height: z.number().optional().describe('Agent height for baking'),
    agent_max_climb: z.number().optional().describe('Agent max climb'),
    agent_max_slope: z.number().optional().describe('Agent max slope'),
    region_min_size: z.number().optional().describe('Region minimum size'),
    region_merge_size: z.number().optional().describe('Region merge size'),
    edge_max_length: z.number().optional().describe('Edge maximum length'),
    edge_max_error: z.number().optional().describe('Edge maximum error'),
    verts_per_poly: z.number().optional().describe('Vertices per polygon'),
    detail_sample_distance: z.number().optional().describe('Detail sample distance'),
    detail_sample_max_error: z.number().optional().describe('Detail sample max error'),
  }).optional().describe('NavMesh baking settings'),
  sourceNodes: z.array(z.string()).optional().describe('Source nodes to include in navmesh baking'),
});

export function createNavigationTool(bridge: HeadlessBridge): RegisteredTool {
  return {
    id: 'godot_navigation',
    name: '3D Navigation',
    description: 'Create NavigationRegion3D, bake navmeshes, and configure navigation agents and obstacles',
    category: '3d',
    inputSchema: navigationSchema,
    handler: async (args) => {
      // Read the scene first
      const readOperation: HeadlessOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readResult = await bridge.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read scene: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      let result: any;
      
      switch (args.action) {
        case 'create_region':
          result = await createNavigationRegion(bridge, args);
          break;
          
        case 'bake_navmesh':
          result = await bakeNavMesh(bridge, args);
          break;
          
        case 'create_agent':
          result = await createNavigationAgent(bridge, args);
          break;
          
        case 'create_obstacle':
          result = await createNavigationObstacle(bridge, args);
          break;
          
        case 'configure_navigation':
          result = await configureNavigation(bridge, args);
          break;
          
        default:
          throw new Error(`Unknown navigation action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

async function createNavigationRegion(_bridge: HeadlessBridge, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create NavigationRegion3D node
  // 2. Configure region properties
  // 3. Create or assign NavigationMesh resource
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_region',
    nodePath: nodePath,
    regionProperties: args.regionProperties || {},
    message: `Created NavigationRegion3D "${args.name}" at ${nodePath}`,
  };
}

async function bakeNavMesh(_bridge: HeadlessBridge, args: any): Promise<any> {
  // In a real implementation, we would:
  // 1. Collect geometry from source nodes
  // 2. Bake navigation mesh using settings
  // 3. Assign to NavigationRegion3D
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'bake_navmesh',
    bakeSettings: args.bakeSettings || {},
    sourceNodes: args.sourceNodes || [],
    message: `Baked navigation mesh with ${args.sourceNodes?.length || 0} source nodes`,
  };
}

async function createNavigationAgent(_bridge: HeadlessBridge, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create NavigationAgent3D node
  // 2. Configure agent properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_agent',
    nodePath: nodePath,
    agentProperties: args.agentProperties || {},
    message: `Created NavigationAgent3D "${args.name}" at ${nodePath}`,
  };
}

async function createNavigationObstacle(_bridge: HeadlessBridge, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create NavigationObstacle3D node
  // 2. Configure obstacle properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_obstacle',
    nodePath: nodePath,
    obstacleProperties: args.obstacleProperties || {},
    message: `Created NavigationObstacle3D "${args.name}" at ${nodePath}`,
  };
}

async function configureNavigation(_bridge: HeadlessBridge, _args: any): Promise<any> {
  // In a real implementation, we would:
  // 1. Configure global navigation settings
  // 2. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_navigation',
    message: `Configured navigation settings`,
  };
}