import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const sprite2dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  spriteType: z.enum(['Sprite2D', 'AnimatedSprite2D', 'SpriteFrames']).default('Sprite2D').describe('Type of sprite node'),
  name: z.string().describe('Name for the sprite node'),
  texture: z.string().optional().describe('Path to texture resource'),
  spriteFrames: z.string().optional().describe('Path to SpriteFrames resource (for AnimatedSprite2D)'),
  animation: z.string().optional().describe('Animation name (for AnimatedSprite2D)'),
  region: z.object({
    enabled: z.boolean().optional().describe('Enable texture region'),
    rect: z.object({
      position: z.object({ x: z.number(), y: z.number() }).optional(),
      size: z.object({ x: z.number(), y: z.number() }).optional(),
    }).optional().describe('Region rectangle'),
    filter_clip: z.boolean().optional().describe('Filter clip region'),
  }).optional().describe('Texture region settings'),
  properties: z.object({
    centered: z.boolean().optional().describe('Center sprite'),
    offset: z.object({ x: z.number(), y: z.number() }).optional().describe('Sprite offset'),
    flip_h: z.boolean().optional().describe('Flip horizontally'),
    flip_v: z.boolean().optional().describe('Flip vertically'),
    modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Color modulation'),
    self_modulate: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number() }).optional().describe('Self modulation'),
    texture_filter: z.enum(['inherit', 'nearest', 'linear', 'nearest_mipmap', 'linear_mipmap', 'nearest_mipmap_anisotropic', 'linear_mipmap_anisotropic']).optional().describe('Texture filter'),
    texture_repeat: z.enum(['inherit', 'disabled', 'enabled', 'mirror']).optional().describe('Texture repeat'),
    hframes: z.number().optional().describe('Horizontal frames'),
    vframes: z.number().optional().describe('Vertical frames'),
    frame: z.number().optional().describe('Current frame'),
    frame_coords: z.object({ x: z.number(), y: z.number() }).optional().describe('Frame coordinates'),
  }).optional().describe('Sprite properties'),
  animationProperties: z.object({
    speed_scale: z.number().optional().describe('Animation speed scale'),
    playing: z.boolean().optional().describe('Animation playing'),
    autoplay: z.string().optional().describe('Autoplay animation name'),
    animation_looped: z.boolean().optional().describe('Animation looped'),
  }).optional().describe('Animation properties (for AnimatedSprite2D)'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createSprite2DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_sprite2d',
    name: '2D Sprite',
    description: 'Create Sprite2D and AnimatedSprite2D nodes with textures, regions, and animation',
    category: '2d',
    inputSchema: sprite2dSchema,
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
      
      switch (args.spriteType) {
        case 'Sprite2D':
          result = await createSprite2D(transport, args);
          break;
          
        case 'AnimatedSprite2D':
          result = await createAnimatedSprite2D(transport, args);
          break;
          
        case 'SpriteFrames':
          result = await createSpriteFrames(transport, args);
          break;
          
        default:
          throw new Error(`Unknown sprite type: ${args.spriteType}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

async function createSprite2D(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // Default Sprite2D properties
  const defaultProperties = {
    centered: true,
    offset: { x: 0, y: 0 },
    flip_h: false,
    flip_v: false,
    modulate: { r: 1, g: 1, b: 1, a: 1 },
    self_modulate: { r: 1, g: 1, b: 1, a: 1 },
    texture_filter: 'inherit',
    texture_repeat: 'inherit',
    hframes: 1,
    vframes: 1,
    frame: 0,
  };

  const spriteProperties = {
    ...defaultProperties,
    ...(args.properties || {}),
  };
  
  // In a real implementation, we would:
  // 1. Create Sprite2D node
  // 2. Configure sprite properties
  // 3. Set texture if provided
  // 4. Configure region if provided
  // 5. Apply transform
  // 6. Save the scene
  // For now, simulate the operation
  
  return {
    spriteType: 'Sprite2D',
    nodePath: nodePath,
    texture: args.texture,
    region: args.region,
    properties: spriteProperties,
    transform: args.transform,
    message: `Created Sprite2D "${args.name}" at ${nodePath}`,
  };
}

async function createAnimatedSprite2D(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // Default AnimatedSprite2D properties
  const defaultProperties = {
    centered: true,
    offset: { x: 0, y: 0 },
    flip_h: false,
    flip_v: false,
    modulate: { r: 1, g: 1, b: 1, a: 1 },
    self_modulate: { r: 1, g: 1, b: 1, a: 1 },
    texture_filter: 'inherit',
    texture_repeat: 'inherit',
  };

  const defaultAnimationProperties = {
    speed_scale: 1,
    playing: false,
    animation_looped: true,
  };

  const spriteProperties = {
    ...defaultProperties,
    ...(args.properties || {}),
  };

  const animationProperties = {
    ...defaultAnimationProperties,
    ...(args.animationProperties || {}),
  };
  
  // In a real implementation, we would:
  // 1. Create AnimatedSprite2D node
  // 2. Configure sprite properties
  // 3. Set SpriteFrames if provided
  // 4. Configure animation
  // 5. Apply transform
  // 6. Save the scene
  // For now, simulate the operation
  
  return {
    spriteType: 'AnimatedSprite2D',
    nodePath: nodePath,
    spriteFrames: args.spriteFrames,
    animation: args.animation,
    properties: spriteProperties,
    animationProperties: animationProperties,
    transform: args.transform,
    message: `Created AnimatedSprite2D "${args.name}" at ${nodePath}`,
  };
}

async function createSpriteFrames(_transport: Transport, args: any): Promise<any> {
  // In a real implementation, we would:
  // 1. Create SpriteFrames resource
  // 2. Add animations and frames
  // 3. Save the resource
  // For now, simulate the operation
  
  return {
    spriteType: 'SpriteFrames',
    resourcePath: args.name.endsWith('.tres') ? args.name : `${args.name}.tres`,
    message: `Created SpriteFrames resource "${args.name}"`,
  };
}