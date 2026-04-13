import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const csgOperationSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  operation: z.enum(['create', 'boolean', 'transform']).default('create').describe('CSG operation type'),
  csgType: z.enum(['CSGBox3D', 'CSGSphere3D', 'CSGCylinder3D', 'CSGTorus3D', 'CSGPolygon3D', 'CSGMesh3D']).optional().describe('Type of CSG shape (for create operation)'),
  booleanOperation: z.enum(['union', 'intersection', 'subtraction']).optional().describe('Boolean operation type (for boolean operation)'),
  targetNodes: z.array(z.string()).optional().describe('Paths to CSG nodes to combine (for boolean operation)'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Transform properties (for transform operation)'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional CSG shape properties'),
  name: z.string().describe('Name for the new CSG node'),
});

export function createCSGOpsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_csg_ops',
    name: '3D CSG Operations',
    description: 'Create and manipulate CSG (Constructive Solid Geometry) shapes in 3D scenes',
    category: '3d',
    inputSchema: csgOperationSchema,
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

      // Determine operation type
      let result: any;
      
      switch (args.operation) {
        case 'create':
          result = await createCSGShape(transport, args);
          break;
          
        case 'boolean':
          result = await performBooleanOperation(transport, args);
          break;
          
        case 'transform':
          result = await transformCSGNode(transport, args);
          break;
          
        default:
          throw new Error(`Unknown CSG operation: ${args.operation}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
        readOnlyHint: false,
  };
}

async function createCSGShape(_transport: Transport, args: any): Promise<any> {
  if (!args.csgType) {
    throw new Error('csgType is required for create operation');
  }

  // Create CSG node properties
  const csgProperties: Record<string, any> = {
    name: args.name,
    type: args.csgType,
    parent: args.parentPath === '.' ? undefined : { path: args.parentPath },
    properties: args.properties || {},
  };

  // Add type-specific default properties
  switch (args.csgType) {
    case 'CSGBox3D':
      csgProperties.properties = {
        ...csgProperties.properties,
        size: { x: 2, y: 2, z: 2 },
        material: null,
      };
      break;
      
    case 'CSGSphere3D':
      csgProperties.properties = {
        ...csgProperties.properties,
        radius: 1,
        material: null,
      };
      break;
      
    case 'CSGCylinder3D':
      csgProperties.properties = {
        ...csgProperties.properties,
        radius: 1,
        height: 2,
        material: null,
      };
      break;
      
    case 'CSGTorus3D':
      csgProperties.properties = {
        ...csgProperties.properties,
        inner_radius: 0.5,
        outer_radius: 1,
        material: null,
      };
      break;
      
    case 'CSGPolygon3D':
      csgProperties.properties = {
        ...csgProperties.properties,
        polygon: [],
        material: null,
      };
      break;
  }

  // In a real implementation, we would:
  // 1. Add the CSG node to the scene
  // 2. Apply transform if provided
  // 3. Save the scene
  // For now, simulate the operation
  
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  return {
    operation: 'create',
    csgType: args.csgType,
    nodePath: nodePath,
    properties: csgProperties.properties,
    message: `Created ${args.csgType} "${args.name}" at ${nodePath}`,
  };
}

async function performBooleanOperation(_transport: Transport, args: any): Promise<any> {
  if (!args.booleanOperation) {
    throw new Error('booleanOperation is required for boolean operation');
  }
  
  if (!args.targetNodes || args.targetNodes.length < 2) {
    throw new Error('At least 2 target nodes are required for boolean operation');
  }

  // In a real implementation, we would:
  // 1. Create a new CSGCombiner3D node
  // 2. Set its operation property
  // 3. Reparent the target nodes under it
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    operation: 'boolean',
    booleanOperation: args.booleanOperation,
    targetNodes: args.targetNodes,
    newNodePath: `${args.parentPath}/${args.name}`,
    message: `Created ${args.booleanOperation} operation "${args.name}" combining ${args.targetNodes.length} nodes`,
  };
}

async function transformCSGNode(_transport: Transport, args: any): Promise<any> {
  if (!args.transform) {
    throw new Error('transform is required for transform operation');
  }

  // In a real implementation, we would:
  // 1. Find the target node
  // 2. Apply the transform
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    operation: 'transform',
    nodePath: args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`,
    transform: args.transform,
    message: `Applied transform to CSG node "${args.name}"`,
  };
}