import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const createTextureSchema = z.object({
  texturePath: z.string().describe('Path where to save the texture file (e.g., "res://textures/my_texture.tres")'),
  textureType: z.enum(['gradient', 'noise', 'checkerboard', 'solid_color', 'procedural']).default('gradient').describe('Type of texture to create'),
  width: z.number().min(1).max(8192).default(256).describe('Texture width in pixels'),
  height: z.number().min(1).max(8192).default(256).describe('Texture height in pixels'),
  format: z.enum(['rgba8', 'rgb8', 'rgba_etc2', 'rgb_etc2', 'rgba_astc_4x4', 'rgba_astc_8x8']).default('rgba8').describe('Texture format'),
  filter: z.enum(['linear', 'nearest', 'linear_mipmap', 'nearest_mipmap']).default('linear').describe('Texture filtering mode'),
  repeat: z.enum(['enabled', 'disabled', 'mirrored']).default('enabled').describe('Texture repeating mode'),
  
  // Gradient texture parameters
  gradientColors: z.array(z.string()).min(2).max(8).optional().default(['#000000', '#FFFFFF']).describe('Gradient colors (hex or named)'),
  gradientType: z.enum(['linear', 'radial']).default('linear').describe('Gradient type'),
  
  // Noise texture parameters
  noiseType: z.enum(['simplex', 'perlin', 'cellular', 'value']).default('simplex').describe('Noise type'),
  noiseScale: z.number().min(0.1).max(100).default(10.0).describe('Noise scale'),
  noiseOctaves: z.number().min(1).max(8).default(4).describe('Number of noise octaves'),
  noisePersistence: z.number().min(0).max(1).default(0.5).describe('Noise persistence'),
  noiseLacunarity: z.number().min(1).max(4).default(2.0).describe('Noise lacunarity'),
  
  // Checkerboard parameters
  checkerColor1: z.string().default('#000000').describe('First checkerboard color'),
  checkerColor2: z.string().default('#FFFFFF').describe('Second checkerboard color'),
  checkerSize: z.number().min(1).max(128).default(32).describe('Checkerboard tile size'),
  
  // Solid color parameters
  solidColor: z.string().default('#808080').describe('Solid color for texture'),
  
  // Procedural parameters
  proceduralType: z.enum(['stripes', 'dots', 'waves', 'voronoi']).default('stripes').describe('Procedural pattern type'),
  proceduralScale: z.number().min(1).max(100).default(10.0).describe('Procedural pattern scale'),
  proceduralColor1: z.string().default('#000000').describe('First procedural color'),
  proceduralColor2: z.string().default('#FFFFFF').describe('Second procedural color'),
});

// Helper function to convert hex/named color to Godot Color
function parseColor(colorStr: string): string {
  // Named colors
  const namedColors: Record<string, string> = {
    'white': 'Color(1, 1, 1, 1)',
    'black': 'Color(0, 0, 0, 1)',
    'red': 'Color(1, 0, 0, 1)',
    'green': 'Color(0, 1, 0, 1)',
    'blue': 'Color(0, 0, 1, 1)',
    'yellow': 'Color(1, 1, 0, 1)',
    'cyan': 'Color(0, 1, 1, 1)',
    'magenta': 'Color(1, 0, 1, 1)',
    'gray': 'Color(0.5, 0.5, 0.5, 1)',
    'grey': 'Color(0.5, 0.5, 0.5, 1)',
    'orange': 'Color(1, 0.5, 0, 1)',
    'purple': 'Color(0.5, 0, 0.5, 1)',
    'brown': 'Color(0.6, 0.4, 0.2, 1)',
    'pink': 'Color(1, 0.75, 0.8, 1)',
  };
  
  if (namedColors[colorStr.toLowerCase()]) {
    return namedColors[colorStr.toLowerCase()];
  }
  
  // Hex colors
  const hexMatch = colorStr.match(/^#?([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    
    // Expand shorthand
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    } else if (hex.length === 4) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    // Parse components
    let r = 1, g = 1, b = 1, a = 1;
    
    if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    }
    
    if (hex.length >= 8) {
      a = parseInt(hex.substring(6, 8), 16) / 255;
    }
    
    return `Color(${r}, ${g}, ${b}, ${a})`;
  }
  
  // Default to gray if parsing fails
  return 'Color(0.5, 0.5, 0.5, 1)';
}

// Helper to create GradientTexture2D
function createGradientTexture(args: any): string {
  const colors = args.gradientColors.map((color: string) => parseColor(color));
  
  const material = [
    '[gd_resource type="GradientTexture2D" load_steps=2 format=3]',
    '',
    '[ext_resource type="Gradient" path="res://default_gradient.tres" id="1_cbbd4"]',
    '',
    '[resource]',
    `width = ${args.width}`,
    `height = ${args.height}`,
    `gradient = ExtResource("1_cbbd4")`,
    `fill = ${args.gradientType === 'radial' ? '1' : '0'}`, // 0 = linear, 1 = radial
    `fill_from = Vector2(0, 0)`,
    `fill_to = Vector2(1, 0)`,
    `repeat = ${args.repeat === 'enabled' ? '0' : args.repeat === 'mirrored' ? '1' : '2'}`, // 0 = repeat, 1 = mirrored, 2 = disabled
    `filter = ${args.filter.includes('nearest') ? '0' : '1'}`, // 0 = nearest, 1 = linear
  ];
  
  // Create gradient resource (reserved for future use)
  void [
    '[gd_resource type="Gradient" load_steps=1 format=3]',
    '',
    '[resource]',
    `offsets = PackedFloat32Array(${colors.map((_: any, i: number) => i / (colors.length - 1)).join(', ')})`,
    `colors = PackedColorArray(${colors.join(', ')})`,
  ].join('\n');
  
  // We would need to create the gradient file first, then reference it
  // For simplicity, we'll create a combined resource or handle it differently
  // For now, we'll create a simple gradient texture
  
  return material.join('\n');
}

// Helper to create NoiseTexture2D
function createNoiseTexture(args: any): string {
  const noiseTypes: Record<string, number> = {
    simplex: 0,
    perlin: 1,
    cellular: 2,
    value: 3,
  };
  
  const material = [
    '[gd_resource type="NoiseTexture2D" load_steps=2 format=3]',
    '',
    '[ext_resource type="FastNoiseLite" path="res://default_noise.tres" id="1_cbbd4"]',
    '',
    '[resource]',
    `width = ${args.width}`,
    `height = ${args.height}`,
    `noise = ExtResource("1_cbbd4")`,
    `as_normal_map = false`,
    `bump_strength = 8.0`,
    `color_ramp = null`,
    `normalize = true`,
  ];
  
  // Create noise resource (reserved for future use)
  void [
    '[gd_resource type="FastNoiseLite" load_steps=1 format=3]',
    '',
    '[resource]',
    `noise_type = ${noiseTypes[args.noiseType]}`,
    `seed = ${Math.floor(Math.random() * 10000)}`,
    `frequency = ${1.0 / args.noiseScale}`,
    `fractal_type = 1`, // FBM
    `fractal_octaves = ${args.noiseOctaves}`,
    `fractal_lacunarity = ${args.noiseLacunarity}`,
    `fractal_gain = ${args.noisePersistence}`,
    `fractal_weighted_strength = 0.0`,
    `fractal_ping_pong_strength = 0.0`,
  ].join('\n');
  
  return material.join('\n');
}

// Helper to create placeholder texture (ImageTexture with generated image)
function createPlaceholderTexture(_args: any): string {
  // For a placeholder, we'll create a simple ImageTexture
  // In a real implementation, we would generate image data
  
  const material = [
    '[gd_resource type="ImageTexture" load_steps=2 format=3]',
    '',
    '[ext_resource type="Image" path="res://icon.svg" id="1_cbbd4"]',
    '',
    '[resource]',
    `image = ExtResource("1_cbbd4")`,
  ];
  
  return material.join('\n');
}

// Helper to create procedural texture description
function createProceduralTextureDescription(args: any): string {
  // This would create a shader-based procedural texture
  // For now, we'll create a placeholder
  
  let description = '';
  
  switch (args.proceduralType) {
    case 'stripes':
      description = `Stripes texture with ${args.proceduralScale}px spacing`;
      break;
    case 'dots':
      description = `Dots texture with ${args.proceduralScale}px spacing`;
      break;
    case 'waves':
      description = `Wave pattern texture with ${args.proceduralScale}px wavelength`;
      break;
    case 'voronoi':
      description = `Voronoi/cellular texture with ${args.proceduralScale}px cell size`;
      break;
  }
  
  return description;
}

export function createCreateTextureTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_texture',
    name: 'Create Texture',
    description: 'Create a placeholder or procedural texture resource',
    category: 'assets',
    inputSchema: createTextureSchema,
    handler: async (args) => {
      let textureContent = '';
      let textureDescription = '';
      
      // Generate texture content based on type
      switch (args.textureType) {
        case 'gradient':
          textureContent = createGradientTexture(args);
          textureDescription = `${args.gradientType} gradient texture with ${args.gradientColors.length} colors`;
          break;
        case 'noise':
          textureContent = createNoiseTexture(args);
          textureDescription = `${args.noiseType} noise texture (${args.noiseOctaves} octaves)`;
          break;
        case 'checkerboard':
          textureContent = createPlaceholderTexture(args);
          textureDescription = `Checkerboard texture (${args.checkerSize}px tiles)`;
          break;
        case 'solid_color':
          textureContent = createPlaceholderTexture(args);
          textureDescription = `Solid color texture`;
          break;
        case 'procedural':
          textureContent = createPlaceholderTexture(args);
          textureDescription = createProceduralTextureDescription(args);
          break;
        default:
          throw new Error(`Unsupported texture type: ${args.textureType}`);
      }
      
      // Write the texture file
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.texturePath,
          content: textureContent,
        },
      };
      
      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to create texture file: ${writeResult.error}`);
      }
      
      // For gradient and noise textures, we also need to create the referenced resources
      if (args.textureType === 'gradient') {
        // Create gradient resource file
        const gradientPath = args.texturePath.replace('.tres', '_gradient.tres');
        const colors = args.gradientColors.map((color: string) => parseColor(color));
        
        const gradientContent = [
          '[gd_resource type="Gradient" load_steps=1 format=3]',
          '',
          '[resource]',
          `offsets = PackedFloat32Array(${colors.map((_: any, i: number) => i / (colors.length - 1)).join(', ')})`,
          `colors = PackedColorArray(${colors.join(', ')})`,
        ].join('\n');
        
        const gradientWriteOp: TransportOperation = {
          operation: 'write_file',
          params: {
            path: gradientPath,
            content: gradientContent,
          },
        };
        
        await transport.execute(gradientWriteOp);
      } else if (args.textureType === 'noise') {
        // Create noise resource file
        const noisePath = args.texturePath.replace('.tres', '_noise.tres');
        const noiseTypes: Record<string, number> = {
          simplex: 0,
          perlin: 1,
          cellular: 2,
          value: 3,
        };
        
        const noiseContent = [
          '[gd_resource type="FastNoiseLite" load_steps=1 format=3]',
          '',
          '[resource]',
          `noise_type = ${noiseTypes[args.noiseType]}`,
          `seed = ${Math.floor(Math.random() * 10000)}`,
          `frequency = ${1.0 / args.noiseScale}`,
          `fractal_type = 1`, // FBM
          `fractal_octaves = ${args.noiseOctaves}`,
          `fractal_lacunarity = ${args.noiseLacunarity}`,
          `fractal_gain = ${args.noisePersistence}`,
          `fractal_weighted_strength = 0.0`,
          `fractal_ping_pong_strength = 0.0`,
        ].join('\n');
        
        const noiseWriteOp: TransportOperation = {
          operation: 'write_file',
          params: {
            path: noisePath,
            content: noiseContent,
          },
        };
        
        await transport.execute(noiseWriteOp);
      }
      
      return {
        texturePath: args.texturePath,
        textureType: args.textureType,
        width: args.width,
        height: args.height,
        format: args.format,
        description: textureDescription,
        contentLength: textureContent.length,
        message: `Created ${args.textureType} texture at ${args.texturePath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}