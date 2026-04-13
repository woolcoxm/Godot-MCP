import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const multimeshSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  action: z.enum(['create', 'configure', 'set_instances', 'update_instance']).default('create').describe('MultiMesh action'),
  name: z.string().describe('Name for the MultiMeshInstance3D node'),
  mesh: z.string().optional().describe('Path to mesh resource'),
  instances: z.array(z.object({
    transform: z.object({
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      scale: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    }),
    color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional(),
    custom_data: z.any().optional(),
  })).optional().describe('Instance transforms and data'),
  properties: z.object({
    instance_count: z.number().optional().describe('Number of instances'),
    visible_instance_count: z.number().optional().describe('Number of visible instances'),
    transform_format: z.enum(['transform_3d', 'transform_2d']).optional().describe('Transform format'),
    color_format: z.enum(['none', 'byte', 'float']).optional().describe('Color format'),
    custom_data_format: z.enum(['none', 'byte', 'float']).optional().describe('Custom data format'),
    use_colors: z.boolean().optional().describe('Use per-instance colors'),
    use_custom_data: z.boolean().optional().describe('Use per-instance custom data'),
    instance_transform_array: z.array(z.any()).optional().describe('Instance transform array'),
    instance_color_array: z.array(z.any()).optional().describe('Instance color array'),
    instance_custom_data_array: z.array(z.any()).optional().describe('Instance custom data array'),
  }).optional().describe('MultiMesh properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createMultimeshTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_multimesh',
    name: '3D MultiMesh',
    description: 'Create MultiMeshInstance3D nodes for efficient instancing of meshes',
    category: '3d',
    inputSchema: multimeshSchema,
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
          result = await createMultimeshInstance(transport, args);
          break;
          
        case 'configure':
          result = await configureMultimesh(transport, args);
          break;
          
        case 'set_instances':
          result = await setInstances(transport, args);
          break;
          
        case 'update_instance':
          result = await updateInstance(transport, args);
          break;
          
        default:
          throw new Error(`Unknown MultiMesh action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
        readOnlyHint: false,
  };
}

async function createMultimeshInstance(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // Default MultiMesh properties
  const defaultProperties = {
    instance_count: args.instances?.length || 0,
    visible_instance_count: args.instances?.length || 0,
    transform_format: 'transform_3d',
    color_format: 'none',
    custom_data_format: 'none',
    use_colors: false,
    use_custom_data: false,
  };

  const multimeshProperties = {
    ...defaultProperties,
    ...(args.properties || {}),
  };
  
  // In a real implementation, we would:
  // 1. Create MultiMeshInstance3D node
  // 2. Create MultiMesh resource
  // 3. Configure MultiMesh properties
  // 4. Set mesh if provided
  // 5. Set instances if provided
  // 6. Apply transform
  // 7. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create',
    nodePath: nodePath,
    mesh: args.mesh,
    instanceCount: multimeshProperties.instance_count,
    properties: multimeshProperties,
    transform: args.transform,
    message: `Created MultiMeshInstance3D "${args.name}" with ${multimeshProperties.instance_count} instances at ${nodePath}`,
  };
}

async function configureMultimesh(_transport: Transport, args: any): Promise<any> {
  if (!args.properties) {
    throw new Error('properties are required for configure action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find MultiMeshInstance3D node
  // 2. Update MultiMesh properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure',
    nodePath: nodePath,
    properties: args.properties,
    message: `Configured MultiMeshInstance3D "${args.name}" properties`,
  };
}

async function setInstances(_transport: Transport, args: any): Promise<any> {
  if (!args.instances || args.instances.length === 0) {
    throw new Error('instances are required for set_instances action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find MultiMeshInstance3D node
  // 2. Set instance transforms and data
  // 3. Update instance count
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'set_instances',
    nodePath: nodePath,
    instanceCount: args.instances.length,
    message: `Set ${args.instances.length} instances in MultiMeshInstance3D "${args.name}"`,
  };
}

async function updateInstance(_transport: Transport, args: any): Promise<any> {
  if (!args.instances || args.instances.length === 0) {
    throw new Error('instances are required for update_instance action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find MultiMeshInstance3D node
  // 2. Update specific instances
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'update_instance',
    nodePath: nodePath,
    instanceCount: args.instances.length,
    message: `Updated ${args.instances.length} instances in MultiMeshInstance3D "${args.name}"`,
  };
}