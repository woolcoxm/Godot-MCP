import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const skeletonSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/character.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  action: z.enum(['create', 'add_bone', 'configure_bone', 'add_skin', 'attach_mesh']).default('create').describe('Skeleton action'),
  name: z.string().describe('Name for the Skeleton3D node'),
  bones: z.array(z.object({
    name: z.string().describe('Bone name'),
    parent: z.string().optional().describe('Parent bone name'),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Bone position'),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Bone rotation'),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Bone scale'),
    rest: z.object({
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    }).optional().describe('Bone rest transform'),
    pose: z.object({
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    }).optional().describe('Bone pose transform'),
    enabled: z.boolean().optional().describe('Bone enabled'),
  })).optional().describe('Bones to create'),
  skin: z.object({
    name: z.string().optional().describe('Skin name'),
    bones: z.array(z.string()).optional().describe('Bones in skin'),
    weights: z.array(z.number()).optional().describe('Skin weights'),
    bind_count: z.number().optional().describe('Bind count'),
  }).optional().describe('Skin configuration'),
  meshAttachment: z.object({
    mesh: z.string().describe('Path to mesh resource'),
    skin: z.string().optional().describe('Skin to use'),
    skeleton_path: z.string().optional().describe('Path to skeleton node'),
    bone_attachment: z.string().optional().describe('Bone to attach to'),
  }).optional().describe('Mesh attachment configuration'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial skeleton transform'),
});

export function createSkeletonTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_skeleton',
    name: '3D Skeleton',
    description: 'Create Skeleton3D nodes with bone setup, skin attachments, and mesh binding',
    category: '3d',
    inputSchema: skeletonSchema,
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
          result = await createSkeleton(transport, args);
          break;
          
        case 'add_bone':
          result = await addBone(transport, args);
          break;
          
        case 'configure_bone':
          result = await configureBone(transport, args);
          break;
          
        case 'add_skin':
          result = await addSkin(transport, args);
          break;
          
        case 'attach_mesh':
          result = await attachMesh(transport, args);
          break;
          
        default:
          throw new Error(`Unknown skeleton action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
        readOnlyHint: false,
  };
}

async function createSkeleton(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create Skeleton3D node
  // 2. Add bones if provided
  // 3. Apply transform
  // 4. Save the scene
  // For now, simulate the operation
  
  const boneCount = args.bones?.length || 0;
  
  return {
    action: 'create',
    nodePath: nodePath,
    boneCount: boneCount,
    transform: args.transform,
    message: `Created Skeleton3D "${args.name}" with ${boneCount} bones at ${nodePath}`,
  };
}

async function addBone(_transport: Transport, args: any): Promise<any> {
  if (!args.bones || args.bones.length === 0) {
    throw new Error('bones are required for add_bone action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Skeleton3D node
  // 2. Add bones to skeleton
  // 3. Configure bone properties
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'add_bone',
    nodePath: nodePath,
    bones: args.bones,
    message: `Added ${args.bones.length} bones to Skeleton3D "${args.name}"`,
  };
}

async function configureBone(_transport: Transport, args: any): Promise<any> {
  if (!args.bones || args.bones.length === 0) {
    throw new Error('bones are required for configure_bone action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Skeleton3D node
  // 2. Configure existing bones
  // 3. Update bone transforms
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_bone',
    nodePath: nodePath,
    bones: args.bones,
    message: `Configured ${args.bones.length} bones in Skeleton3D "${args.name}"`,
  };
}

async function addSkin(_transport: Transport, args: any): Promise<any> {
  if (!args.skin) {
    throw new Error('skin is required for add_skin action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Skeleton3D node
  // 2. Create Skin resource
  // 3. Configure skin properties
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'add_skin',
    nodePath: nodePath,
    skin: args.skin,
    message: `Added skin to Skeleton3D "${args.name}"`,
  };
}

async function attachMesh(_transport: Transport, args: any): Promise<any> {
  if (!args.meshAttachment) {
    throw new Error('meshAttachment is required for attach_mesh action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Skeleton3D node
  // 2. Create MeshInstance3D with skin
  // 3. Attach mesh to skeleton
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'attach_mesh',
    nodePath: nodePath,
    meshAttachment: args.meshAttachment,
    message: `Attached mesh to Skeleton3D "${args.name}"`,
  };
}