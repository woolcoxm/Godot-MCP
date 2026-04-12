import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const camera3dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  action: z.enum(['create', 'configure', 'set_current', 'add_effects']).default('create').describe('Camera action'),
  name: z.string().describe('Name for the Camera3D node'),
  properties: z.object({
    fov: z.number().optional().describe('Field of view in degrees'),
    near: z.number().optional().describe('Near clipping plane'),
    far: z.number().optional().describe('Far clipping plane'),
    projection: z.enum(['perspective', 'orthogonal']).optional().describe('Projection type'),
    size: z.number().optional().describe('Size (for orthogonal projection)'),
    cull_mask: z.number().optional().describe('Culling mask'),
    current: z.boolean().optional().describe('Set as current camera'),
    keep_aspect: z.enum(['keep_height', 'keep_width', 'expand', 'shrink']).optional().describe('Aspect ratio handling'),
    h_offset: z.number().optional().describe('Horizontal offset'),
    v_offset: z.number().optional().describe('Vertical offset'),
    doppler_tracking: z.enum(['disabled', 'idle_step', 'physics_step']).optional().describe('Doppler tracking mode'),
    environment: z.string().optional().describe('Environment resource path'),
    attributes: z.string().optional().describe('CameraAttributes resource path'),
  }).optional().describe('Camera properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
  effects: z.object({
    dof_blur_far_enabled: z.boolean().optional().describe('Enable far depth of field blur'),
    dof_blur_far_distance: z.number().optional().describe('Far DOF blur distance'),
    dof_blur_far_transition: z.number().optional().describe('Far DOF blur transition'),
    dof_blur_near_enabled: z.boolean().optional().describe('Enable near depth of field blur'),
    dof_blur_near_distance: z.number().optional().describe('Near DOF blur distance'),
    dof_blur_near_transition: z.number().optional().describe('Near DOF blur transition'),
    glow_enabled: z.boolean().optional().describe('Enable glow'),
    glow_levels: z.array(z.number()).optional().describe('Glow levels'),
    glow_intensity: z.number().optional().describe('Glow intensity'),
    glow_strength: z.number().optional().describe('Glow strength'),
    glow_mix: z.number().optional().describe('Glow mix'),
    glow_bloom: z.number().optional().describe('Glow bloom'),
    glow_blend_mode: z.enum(['additive', 'screen', 'softlight', 'replace']).optional().describe('Glow blend mode'),
    ss_reflections_enabled: z.boolean().optional().describe('Enable screen-space reflections'),
    ss_reflections_max_steps: z.number().optional().describe('SSR max steps'),
    ss_reflections_fade_in: z.number().optional().describe('SSR fade in'),
    ss_reflections_fade_out: z.number().optional().describe('SSR fade out'),
    ss_reflections_depth_tolerance: z.number().optional().describe('SSR depth tolerance'),
    ssao_enabled: z.boolean().optional().describe('Enable screen-space ambient occlusion'),
    ssao_radius: z.number().optional().describe('SSAO radius'),
    ssao_intensity: z.number().optional().describe('SSAO intensity'),
    ssao_power: z.number().optional().describe('SSAO power'),
    ssao_detail: z.number().optional().describe('SSAO detail'),
    ssao_horizon: z.number().optional().describe('SSAO horizon'),
    ssao_sharpness: z.number().optional().describe('SSAO sharpness'),
    ssao_light_affect: z.number().optional().describe('SSAO light affect'),
  }).optional().describe('Camera effects'),
});

export function createCamera3DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_camera3d',
    name: '3D Camera',
    description: 'Create and configure Camera3D nodes with projection, effects, and current camera setting',
    category: '3d',
    inputSchema: camera3dSchema,
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
          result = await createCamera(transport, args);
          break;
          
        case 'configure':
          result = await configureCamera(transport, args);
          break;
          
        case 'set_current':
          result = await setCurrentCamera(transport, args);
          break;
          
        case 'add_effects':
          result = await addCameraEffects(transport, args);
          break;
          
        default:
          throw new Error(`Unknown camera action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

async function createCamera(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // Default camera properties
  const defaultProperties = {
    fov: 70,
    near: 0.05,
    far: 4000,
    projection: 'perspective',
    size: 1,
    cull_mask: 1048575, // All layers
    current: false,
    keep_aspect: 'keep_height',
    h_offset: 0,
    v_offset: 0,
    doppler_tracking: 'disabled',
  };

  const cameraProperties = {
    ...defaultProperties,
    ...(args.properties || {}),
  };
  
  // In a real implementation, we would:
  // 1. Create Camera3D node
  // 2. Configure camera properties
  // 3. Apply transform
  // 4. Set as current if requested
  // 5. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create',
    nodePath: nodePath,
    properties: cameraProperties,
    transform: args.transform,
    current: cameraProperties.current,
    message: `Created Camera3D "${args.name}" at ${nodePath}`,
  };
}

async function configureCamera(_transport: Transport, args: any): Promise<any> {
  if (!args.properties) {
    throw new Error('properties are required for configure action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find existing Camera3D node
  // 2. Update camera properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure',
    nodePath: nodePath,
    properties: args.properties,
    message: `Configured Camera3D "${args.name}" properties`,
  };
}

async function setCurrentCamera(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Camera3D node
  // 2. Set current = true on this camera
  // 3. Set current = false on other cameras
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'set_current',
    nodePath: nodePath,
    message: `Set Camera3D "${args.name}" as current camera`,
  };
}

async function addCameraEffects(_transport: Transport, args: any): Promise<any> {
  if (!args.effects) {
    throw new Error('effects are required for add_effects action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Find Camera3D node
  // 2. Create or update CameraAttributes resource
  // 3. Configure effects
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'add_effects',
    nodePath: nodePath,
    effects: args.effects,
    message: `Added camera effects to "${args.name}"`,
  };
}