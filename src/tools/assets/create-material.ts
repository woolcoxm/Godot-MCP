import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const createMaterialSchema = z.object({
  materialPath: z.string().describe('Path where to save the material file (e.g., "res://materials/my_material.tres")'),
  materialType: z.enum(['standard_3d', 'shader', 'canvas_item', 'particles']).default('standard_3d').describe('Type of material to create'),
  shaderPath: z.string().optional().describe('Path to shader for ShaderMaterial (required for shader type)'),
  albedoColor: z.string().optional().describe('Albedo color for StandardMaterial3D (hex or named color)'),
  metallic: z.number().min(0).max(1).optional().default(0.0).describe('Metallic value (0.0-1.0)'),
  roughness: z.number().min(0).max(1).optional().default(0.5).describe('Roughness value (0.0-1.0)'),
  emissionColor: z.string().optional().describe('Emission color (hex or named color)'),
  emissionEnergy: z.number().min(0).optional().default(1.0).describe('Emission energy multiplier'),
  transparency: z.enum(['opaque', 'alpha', 'alpha_scissor', 'alpha_hash', 'depth_prepass_alpha']).optional().default('opaque').describe('Transparency mode'),
  cullMode: z.enum(['back', 'front', 'disabled']).optional().default('back').describe('Face culling mode'),
  flags: z.object({
    unshaded: z.boolean().optional().default(false).describe('Disable lighting (unshaded)'),
    noDepthTest: z.boolean().optional().default(false).describe('Disable depth test'),
    useShadowToOpacity: z.boolean().optional().default(false).describe('Use shadow to opacity'),
    transparent: z.boolean().optional().default(false).describe('Transparent material'),
  }).optional().describe('Material flags'),
  textures: z.object({
    albedo: z.string().optional().describe('Path to albedo texture'),
    normal: z.string().optional().describe('Path to normal map'),
    metallic: z.string().optional().describe('Path to metallic texture'),
    roughness: z.string().optional().describe('Path to roughness texture'),
    emission: z.string().optional().describe('Path to emission texture'),
    ao: z.string().optional().describe('Path to ambient occlusion texture'),
  }).optional().describe('Texture paths'),
});

// Helper function to convert hex/named color to Godot Color
function parseColor(colorStr?: string): string | undefined {
  if (!colorStr) return undefined;
  
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
  
  return undefined;
}

// Helper to create StandardMaterial3D
function createStandardMaterial3D(args: any): string {
  const albedoColor = parseColor(args.albedoColor) || 'Color(1, 1, 1, 1)';
  const emissionColor = parseColor(args.emissionColor) || 'Color(0, 0, 0, 1)';
  
  const transparencyModes: Record<string, number> = {
    opaque: 0,
    alpha: 1,
    alpha_scissor: 2,
    alpha_hash: 3,
    depth_prepass_alpha: 4,
  };
  
  const cullModes: Record<string, number> = {
    back: 0,
    front: 1,
    disabled: 2,
  };
  
  const material = [
    '[gd_resource type="StandardMaterial3D" load_steps=2 format=3]',
    '',
    '[ext_resource type="Texture2D" path="res://icon.svg" id="1_cbbd4"]',
  ];
  
  // Add texture resources if provided
  const textureResources: string[] = [];
  let textureId = 2;
  const textureMappings: Record<string, number> = {};
  
  if (args.textures) {
    for (const [type, path] of Object.entries(args.textures)) {
      if (path) {
        textureResources.push(`[ext_resource type="Texture2D" path="${path}" id="${textureId}"]`);
        textureMappings[type] = textureId;
        textureId++;
      }
    }
  }
  
  if (textureResources.length > 0) {
    material.splice(2, 0, ...textureResources);
    material[1] = `[gd_resource type="StandardMaterial3D" load_steps=${2 + textureResources.length} format=3]`;
  }
  
  material.push('');
  material.push('[resource]');
  
  // Material properties
  const properties = [
    `albedo_color = ${albedoColor}`,
    `metallic = ${args.metallic ?? 0.0}`,
    `metallic_specular = 0.5`,
    `roughness = ${args.roughness ?? 0.5}`,
    `emission_enabled = ${args.emissionColor ? 'true' : 'false'}`,
    `emission = ${emissionColor}`,
    `emission_energy = ${args.emissionEnergy ?? 1.0}`,
    `transparency = ${transparencyModes[args.transparency || 'opaque']}`,
    `cull_mode = ${cullModes[args.cullMode || 'back']}`,
    `flags_unshaded = ${args.flags?.unshaded ? 'true' : 'false'}`,
    `flags_no_depth_test = ${args.flags?.noDepthTest ? 'true' : 'false'}`,
    `flags_use_shadow_to_opacity = ${args.flags?.useShadowToOpacity ? 'true' : 'false'}`,
    `flags_transparent = ${args.flags?.transparent ? 'true' : 'false'}`,
  ];
  
  // Add texture properties
  if (textureMappings.albedo) {
    properties.push(`albedo_texture = ExtResource("${textureMappings.albedo}")`);
  }
  if (textureMappings.normal) {
    properties.push(`normal_enabled = true`);
    properties.push(`normal_texture = ExtResource("${textureMappings.normal}")`);
  }
  if (textureMappings.metallic) {
    properties.push(`metallic_texture_channel = 0`);
    properties.push(`metallic_texture = ExtResource("${textureMappings.metallic}")`);
  }
  if (textureMappings.roughness) {
    properties.push(`roughness_texture_channel = 0`);
    properties.push(`roughness_texture = ExtResource("${textureMappings.roughness}")`);
  }
  if (textureMappings.emission) {
    properties.push(`emission_texture = ExtResource("${textureMappings.emission}")`);
  }
  if (textureMappings.ao) {
    properties.push(`ao_enabled = true`);
    properties.push(`ao_texture = ExtResource("${textureMappings.ao}")`);
  }
  
  material.push(...properties);
  
  return material.join('\n');
}

// Helper to create ShaderMaterial
function createShaderMaterial(args: any): string {
  if (!args.shaderPath) {
    throw new Error('shaderPath is required for ShaderMaterial');
  }
  
  return [
    '[gd_resource type="ShaderMaterial" load_steps=2 format=3]',
    '',
    `[ext_resource type="Shader" path="${args.shaderPath}" id="1_cbbd4"]`,
    '',
    '[resource]',
    `shader = ExtResource("1_cbbd4")`,
  ].join('\n');
}

// Helper to create CanvasItemMaterial (for 2D)
function createCanvasItemMaterial(args: any): string {
  const material = [
    '[gd_resource type="CanvasItemMaterial" load_steps=1 format=3]',
    '',
    '[resource]',
  ];
  
  const properties = [
    `blend_mode = 0`, // Mix
    `light_mode = 0`, // Normal
  ];
  
  if (args.flags) {
    properties.push(`particles_animation = ${args.flags.particlesAnimation ? 'true' : 'false'}`);
  }
  
  material.push(...properties);
  
  return material.join('\n');
}

// Helper to create ParticlesMaterial
function createParticlesMaterial(args: any): string {
  const material = [
    '[gd_resource type="ParticlesMaterial" load_steps=1 format=3]',
    '',
    '[resource]',
  ];
  
  const properties = [
    `emission_shape = 0`, // Point
    `direction = Vector3(0, 1, 0)`,
    `spread = 45.0`,
    `flatness = 0.0`,
    `gravity = Vector3(0, -9.8, 0)`,
    `initial_velocity = 1.0`,
    `initial_velocity_random = 0.0`,
    `angular_velocity = 0.0`,
    `angular_velocity_random = 0.0`,
    `linear_accel = 0.0`,
    `linear_accel_random = 0.0`,
    `radial_accel = 0.0`,
    `radial_accel_random = 0.0`,
    `tangential_accel = 0.0`,
    `tangential_accel_random = 0.0`,
    `damping = 0.0`,
    `damping_random = 0.0`,
    `angle = 0.0`,
    `angle_random = 0.0`,
    `scale = 1.0`,
    `scale_random = 0.0`,
    `color = Color(1, 1, 1, 1)`,
    `color_random = 0.0`,
    `hue_variation = 0.0`,
    `hue_variation_random = 0.0`,
    `anim_speed = 0.0`,
    `anim_speed_random = 0.0`,
    `anim_offset = 0.0`,
    `anim_offset_random = 0.0`,
  ];
  
  material.push(...properties);
  
  return material.join('\n');
}

export function createCreateMaterialTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_material',
    name: 'Create Material',
    description: 'Create a new material resource file (.tres)',
    category: 'assets',
    inputSchema: createMaterialSchema,
    handler: async (args) => {
      let materialContent = '';
      
      // Generate material content based on type
      switch (args.materialType) {
        case 'standard_3d':
          materialContent = createStandardMaterial3D(args);
          break;
        case 'shader':
          materialContent = createShaderMaterial(args);
          break;
        case 'canvas_item':
          materialContent = createCanvasItemMaterial(args);
          break;
        case 'particles':
          materialContent = createParticlesMaterial(args);
          break;
        default:
          throw new Error(`Unsupported material type: ${args.materialType}`);
      }
      
      // Write the material file
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.materialPath,
          content: materialContent,
        },
      };
      
      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to create material file: ${writeResult.error}`);
      }
      
      return {
        materialPath: args.materialPath,
        materialType: args.materialType,
        contentLength: materialContent.length,
        message: `Created ${args.materialType} material at ${args.materialPath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}