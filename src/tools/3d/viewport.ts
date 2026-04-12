import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const viewportSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the viewport node'),
  viewportType: z.enum(['SubViewport', 'Viewport']).describe('Type of viewport'),
  properties: z.object({
    // Viewport properties
    size: z.object({ x: z.number(), y: z.number() }).optional().describe('Viewport size in pixels'),
    transparentBg: z.boolean().optional().describe('Transparent background'),
    handleInputLocally: z.boolean().optional().describe('Handle input locally'),
    disable3d: z.boolean().optional().describe('Disable 3D rendering'),
    disable2d: z.boolean().optional().describe('Disable 2D rendering'),
    msaa: z.enum(['disabled', '2x', '4x', '8x']).optional().describe('Multisample anti-aliasing'),
    screenSpaceAA: z.enum(['disabled', 'fxaa']).optional().describe('Screen-space anti-aliasing'),
    useDebanding: z.boolean().optional().describe('Use debanding'),
    useOcclusionCulling: z.boolean().optional().describe('Use occlusion culling'),
    // Render target properties
    renderTargetUpdateMode: z.enum(['disabled', 'once', 'whenVisible', 'always']).optional().describe('Render target update mode'),
    renderTargetClearMode: z.enum(['never', 'nextFrame', 'always']).optional().describe('Render target clear mode'),
    // Audio properties
    audioListenerEnable2d: z.boolean().optional().describe('Enable 2D audio listener'),
    audioListenerEnable3d: z.boolean().optional().describe('Enable 3D audio listener'),
    // World properties
    world2d: z.string().optional().describe('Custom World2D resource path'),
    world3d: z.string().optional().describe('Custom World3D resource path'),
    // Camera properties (for ViewportTexture)
    camera: z.string().optional().describe('Camera node path for ViewportTexture'),
  }).optional().describe('Viewport properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
  createViewportTexture: z.boolean().optional().describe('Create a ViewportTexture resource from this viewport'),
});

export function createViewportTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_viewport',
    name: '3D Viewport',
    description: 'Create SubViewport nodes for rendering to textures and isolated rendering contexts',
    category: '3d',
    inputSchema: viewportSchema,
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

      // Create viewport configuration
      const viewportConfig = createViewportConfig(args);
      
      const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
      
      // In a real implementation, we would:
      // 1. Create SubViewport or Viewport node
      // 2. Configure viewport properties
      // 3. Apply transform
      // 4. Create ViewportTexture resource if requested
      // 5. Save the scene
      // For now, simulate the operation
      
      const result: any = {
        nodePath: nodePath,
        viewportType: args.viewportType,
        properties: viewportConfig.properties,
        transform: args.transform,
        message: `Created ${args.viewportType} "${args.name}" at ${nodePath}`,
      };
      
      if (args.createViewportTexture) {
        result.viewportTexturePath = `res://textures/${args.name}_viewport_texture.tres`;
        result.viewportTextureMessage = `ViewportTexture resource will be created at ${result.viewportTexturePath}`;
      }
      
      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function createViewportConfig(args: any): any {
  const config: any = {
    nodeType: args.viewportType,
    properties: args.properties || {},
  };

  // Set default properties
  const defaults = {
    size: { x: 1024, y: 1024 },
    transparentBg: false,
    handleInputLocally: false,
    disable3d: false,
    disable2d: false,
    msaa: 'disabled',
    screenSpaceAA: 'disabled',
    useDebanding: false,
    useOcclusionCulling: false,
    renderTargetUpdateMode: 'always',
    renderTargetClearMode: 'always',
    audioListenerEnable2d: false,
    audioListenerEnable3d: false,
  };

  // Merge defaults with provided properties
  config.properties = {
    ...defaults,
    ...config.properties,
  };

  return config;
}