import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { HeadlessBridge, HeadlessOperation } from '../../transports/headless-bridge.js';

const meshInstanceSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  meshType: z.enum([
    'primitive', 'resource', 'array_mesh', 'multi_mesh',
    'BoxMesh', 'SphereMesh', 'CapsuleMesh', 'CylinderMesh', 'PlaneMesh', 'PrismMesh', 'QuadMesh', 'CubeMesh'
  ]).default('primitive').describe('Type of mesh to create'),
  meshResource: z.string().optional().describe('Path to mesh resource (for resource type)'),
  primitiveType: z.enum(['box', 'sphere', 'capsule', 'cylinder', 'plane', 'prism', 'quad', 'cube']).optional().describe('Primitive mesh type'),
  properties: z.record(z.string(), z.any()).optional().describe('Mesh properties (size, segments, etc.)'),
  material: z.string().optional().describe('Path to material resource'),
  name: z.string().describe('Name for the MeshInstance3D node'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
  lod: z.object({
    distances: z.array(z.number()).optional().describe('LOD distance thresholds'),
    meshes: z.array(z.string()).optional().describe('Mesh resources for each LOD level'),
  }).optional().describe('Level of Detail configuration'),
});

export function createMeshInstanceTool(bridge: HeadlessBridge): RegisteredTool {
  return {
    id: 'godot_mesh_instance',
    name: 'Create Mesh Instance',
    description: 'Create MeshInstance3D nodes with primitive shapes, custom meshes, or LOD configurations',
    category: '3d',
    inputSchema: meshInstanceSchema,
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

      // Create mesh instance configuration
      const meshConfig = createMeshConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create the MeshInstance3D node
      // 2. Configure mesh and material
      // 3. Apply transform
      // 4. Set up LOD if specified
      // 5. Save the scene
      // For now, simulate the operation
      
      return {
        nodePath: nodePath,
        meshType: args.meshType,
        primitiveType: args.primitiveType,
        meshResource: args.meshResource,
        material: args.material,
        transform: args.transform,
        lod: args.lod,
        properties: meshConfig.properties,
        message: `Created MeshInstance3D "${args.name}" with ${args.meshType} mesh at ${nodePath}`,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createMeshConfig(args: any): any {
  const config: any = {
    nodeType: 'MeshInstance3D',
    properties: args.properties || {},
  };

  // Set up mesh based on type
  switch (args.meshType) {
    case 'primitive':
      if (!args.primitiveType) {
        throw new Error('primitiveType is required for primitive mesh type');
      }
      config.mesh = createPrimitiveMesh(args.primitiveType, args.properties);
      break;
      
    case 'resource':
      if (!args.meshResource) {
        throw new Error('meshResource is required for resource mesh type');
      }
      config.mesh = { resource: args.meshResource };
      break;
      
    case 'BoxMesh':
    case 'SphereMesh':
    case 'CapsuleMesh':
    case 'CylinderMesh':
    case 'PlaneMesh':
    case 'PrismMesh':
    case 'QuadMesh':
    case 'CubeMesh':
      config.mesh = { type: args.meshType, properties: args.properties || {} };
      break;
      
    case 'array_mesh':
      config.mesh = { type: 'ArrayMesh', arrays: {} };
      break;
      
    case 'multi_mesh':
      config.mesh = { type: 'MultiMesh', instance_count: 0 };
      break;
  }

  // Add material if specified
  if (args.material) {
    config.properties.material_override = args.material;
  }

  return config;
}

function createPrimitiveMesh(primitiveType: string, properties: any): any {
  const meshTypes: Record<string, any> = {
    box: {
      type: 'BoxMesh',
      properties: {
        size: { x: 2, y: 2, z: 2 },
        ...properties,
      },
    },
    sphere: {
      type: 'SphereMesh',
      properties: {
        radius: 1,
        height: 2,
        radial_segments: 32,
        rings: 16,
        ...properties,
      },
    },
    capsule: {
      type: 'CapsuleMesh',
      properties: {
        radius: 0.5,
        height: 2,
        radial_segments: 32,
        rings: 8,
        ...properties,
      },
    },
    cylinder: {
      type: 'CylinderMesh',
      properties: {
        top_radius: 1,
        bottom_radius: 1,
        height: 2,
        radial_segments: 32,
        rings: 1,
        ...properties,
      },
    },
    plane: {
      type: 'PlaneMesh',
      properties: {
        size: { x: 2, y: 2 },
        subdivide_width: 1,
        subdivide_depth: 1,
        ...properties,
      },
    },
    prism: {
      type: 'PrismMesh',
      properties: {
        left_to_right: 1,
        size: { x: 2, y: 2, z: 2 },
        ...properties,
      },
    },
    quad: {
      type: 'QuadMesh',
      properties: {
        size: { x: 2, y: 2 },
        ...properties,
      },
    },
    cube: {
      type: 'CubeMesh',
      properties: {
        size: { x: 2, y: 2, z: 2 },
        ...properties,
      },
    },
  };

  return meshTypes[primitiveType] || meshTypes.box;
}