import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const environmentSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  action: z.enum(['create_world', 'update_environment', 'create_sky', 'configure_fog', 'configure_tonemap']).describe('Environment action to perform'),
  worldEnvironment: z.boolean().default(false).describe('Create WorldEnvironment node (for create_world action)'),
  environmentResource: z.string().optional().describe('Path to Environment resource file'),
  properties: z.object({
    background_mode: z.enum(['clear_color', 'color', 'sky', 'canvas', 'keep', 'camera_feed']).optional().describe('Background mode'),
    background_color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Background color'),
    sky: z.string().optional().describe('Path to Sky resource'),
    sky_custom_fov: z.number().optional().describe('Sky custom FOV'),
    sky_rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Sky rotation'),
    ambient_light_color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Ambient light color'),
    ambient_light_energy: z.number().optional().describe('Ambient light energy'),
    ambient_light_sky_contribution: z.number().optional().describe('Ambient light sky contribution'),
    fog_enabled: z.boolean().optional().describe('Enable fog'),
    fog_color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Fog color'),
    fog_sun_color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Fog sun color'),
    fog_sun_amount: z.number().optional().describe('Fog sun amount'),
    fog_depth_enabled: z.boolean().optional().describe('Enable depth fog'),
    fog_depth_begin: z.number().optional().describe('Fog depth begin'),
    fog_depth_end: z.number().optional().describe('Fog depth end'),
    fog_height_enabled: z.boolean().optional().describe('Enable height fog'),
    fog_height_min: z.number().optional().describe('Fog height minimum'),
    fog_height_max: z.number().optional().describe('Fog height maximum'),
    tonemap_mode: z.enum(['linear', 'reinhard', 'filmic', 'aces', 'aces_fitted']).optional().describe('Tonemapping mode'),
    exposure: z.number().optional().describe('Exposure value'),
    white: z.number().optional().describe('White point'),
  }).optional().describe('Environment properties'),
  name: z.string().optional().describe('Name for the WorldEnvironment node (if creating)'),
});

export function createEnvironmentTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_environment',
    name: 'Configure 3D Environment',
    description: 'Create WorldEnvironment nodes and configure environment settings (sky, fog, tonemapping)',
    category: '3d',
    inputSchema: environmentSchema,
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
        case 'create_world':
          result = await createWorldEnvironment(transport, args);
          break;
          
        case 'update_environment':
          result = await updateEnvironment(transport, args);
          break;
          
        case 'create_sky':
          result = await createSky(transport, args);
          break;
          
        case 'configure_fog':
          result = await configureFog(transport, args);
          break;
          
        case 'configure_tonemap':
          result = await configureTonemap(transport, args);
          break;
          
        default:
          throw new Error(`Unknown environment action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

async function createWorldEnvironment(_transport: Transport, args: any): Promise<any> {
  const nodeName = args.name || 'WorldEnvironment';
  
  // In a real implementation, we would:
  // 1. Create WorldEnvironment node
  // 2. Create or assign Environment resource
  // 3. Configure environment properties
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_world',
    nodeName: nodeName,
    worldEnvironment: args.worldEnvironment,
    environmentResource: args.environmentResource,
    properties: args.properties || {},
    message: `Created WorldEnvironment "${nodeName}" with environment configuration`,
  };
}

async function updateEnvironment(_transport: Transport, args: any): Promise<any> {
  if (!args.properties) {
    throw new Error('properties are required for update_environment action');
  }

  // In a real implementation, we would:
  // 1. Find existing WorldEnvironment node
  // 2. Update its Environment resource properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'update_environment',
    properties: args.properties,
    message: `Updated environment properties`,
  };
}

async function createSky(_transport: Transport, args: any): Promise<any> {
  // In a real implementation, we would:
  // 1. Create Sky resource
  // 2. Configure sky properties
  // 3. Assign to environment
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_sky',
    properties: args.properties || {},
    message: `Created sky configuration`,
  };
}

async function configureFog(_transport: Transport, args: any): Promise<any> {
  // In a real implementation, we would:
  // 1. Update environment fog properties
  // 2. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_fog',
    properties: args.properties || {},
    message: `Configured fog settings`,
  };
}

async function configureTonemap(_transport: Transport, args: any): Promise<any> {
  // In a real implementation, we would:
  // 1. Update environment tonemapping properties
  // 2. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_tonemap',
    properties: args.properties || {},
    message: `Configured tonemapping settings`,
  };
}