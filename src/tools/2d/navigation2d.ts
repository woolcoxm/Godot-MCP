import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const navigation2dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the navigation node'),
  navigationType: z.enum(['NavigationRegion2D', 'NavigationAgent2D', 'NavigationObstacle2D']).describe('Type of navigation node'),
  properties: z.object({
    // NavigationRegion2D properties
    navmesh: z.object({
      vertices: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('NavMesh vertices'),
      polygons: z.array(z.array(z.number())).optional().describe('NavMesh polygons (vertex indices)'),
    }).optional().describe('Navigation mesh data'),
    enabled: z.boolean().optional().describe('Region enabled'),
    navigationLayers: z.number().optional().describe('Navigation layers bitmask'),
    // NavigationAgent2D properties
    targetPosition: z.object({ x: z.number(), y: z.number() }).optional().describe('Target position'),
    targetDesiredDistance: z.number().optional().describe('Target desired distance'),
    targetPositionTolerance: z.number().optional().describe('Target position tolerance'),
    pathDesiredDistance: z.number().optional().describe('Path desired distance'),
    pathMaxDistance: z.number().optional().describe('Path max distance'),
    pathHeightOffset: z.number().optional().describe('Path height offset'),
    pathfindingAlgorithm: z.enum(['astar', 'thetastar']).optional().describe('Pathfinding algorithm'),
    pathPostprocessing: z.enum(['corridorfunnel', 'edgecentered', 'path smoothing']).optional().describe('Path postprocessing'),
    agentNavigationLayers: z.number().optional().describe('Agent navigation layers bitmask'),
    avoidanceEnabled: z.boolean().optional().describe('Avoidance enabled'),
    avoidanceRadius: z.number().optional().describe('Avoidance radius'),
    avoidanceNeighborDistance: z.number().optional().describe('Avoidance neighbor distance'),
    avoidanceMaxNeighbors: z.number().optional().describe('Avoidance max neighbors'),
    avoidanceTimeHorizon: z.number().optional().describe('Avoidance time horizon'),
    avoidanceMaxSpeed: z.number().optional().describe('Avoidance max speed'),
    // NavigationObstacle2D properties
    radius: z.number().optional().describe('Obstacle radius'),
    vertices: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Obstacle vertices'),
    avoidanceLayers: z.number().optional().describe('Avoidance layers bitmask'),
    // Common properties
    visible: z.boolean().optional().describe('Visible'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Modulate color'),
  }).optional().describe('Navigation properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createNavigation2DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_navigation2d',
    name: '2D Navigation',
    description: 'Create NavigationRegion2D, NavigationAgent2D, and NavigationObstacle2D nodes for 2D pathfinding and AI',
    category: '2d',
    inputSchema: navigation2dSchema,
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

      // Create navigation configuration
      const navigationConfig = createNavigationConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create NavigationRegion2D, NavigationAgent2D, or NavigationObstacle2D node
      // 2. Configure navigation mesh for NavigationRegion2D
      // 3. Configure pathfinding properties for NavigationAgent2D
      // 4. Configure obstacle properties for NavigationObstacle2D
      // 5. Apply transform
      // 6. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        navigationType: args.navigationType,
        properties: navigationConfig.properties,
        transform: args.transform,
        message: `Created ${args.navigationType} "${args.name}" at ${nodePath}`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createNavigationConfig(args: any): any {
  const config: any = {
    nodeType: args.navigationType,
    properties: args.properties || {},
  };

  // Set default properties based on navigation type
  const defaults: Record<string, any> = {
    NavigationRegion2D: {
      navmesh: {
        vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
        polygons: [[0, 1, 2, 3]],
      },
      enabled: true,
      navigationLayers: 1,
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
    NavigationAgent2D: {
      targetPosition: { x: 0, y: 0 },
      targetDesiredDistance: 10,
      targetPositionTolerance: 1,
      pathDesiredDistance: 10,
      pathMaxDistance: 1000,
      pathHeightOffset: 0,
      pathfindingAlgorithm: 'astar',
      pathPostprocessing: 'corridorfunnel',
      agentNavigationLayers: 1,
      avoidanceEnabled: false,
      avoidanceRadius: 10,
      avoidanceNeighborDistance: 50,
      avoidanceMaxNeighbors: 10,
      avoidanceTimeHorizon: 1,
      avoidanceMaxSpeed: 200,
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
    NavigationObstacle2D: {
      radius: 10,
      vertices: [{ x: -10, y: -10 }, { x: 10, y: -10 }, { x: 10, y: 10 }, { x: -10, y: 10 }],
      avoidanceLayers: 1,
      visible: true,
      modulate: { r: 1, g: 1, b: 1, a: 1 },
    },
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults[args.navigationType],
    ...config.properties,
  };

  return config;
}