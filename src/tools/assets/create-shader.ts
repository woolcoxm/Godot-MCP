import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const createShaderSchema = z.object({
  shaderPath: z.string().describe('Path where to save the shader file (e.g., "res://shaders/my_shader.gdshader")'),
  shaderType: z.enum(['spatial', 'canvas_item', 'particles', 'sky']).default('spatial').describe('Type of shader to create'),
  renderMode: z.string().optional().describe('Render mode (e.g., "opaque", "blend_mix", "unshaded")'),
  shaderTemplate: z.enum(['empty', 'simple_color', 'textured', 'gradient', 'noise', 'water', 'fire', 'glow']).default('empty').describe('Template to use for the shader'),
  parameters: z.record(z.string(), z.object({
    type: z.enum(['float', 'vec2', 'vec3', 'vec4', 'color', 'sampler2D', 'bool', 'int']),
    default: z.any().optional(),
    hint: z.enum(['none', 'range', 'color', 'albedo', 'normal', 'black', 'white', 'gray', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta']).optional(),
    hint_string: z.string().optional(),
  })).optional().describe('Shader parameters (uniforms)'),
  customCode: z.string().optional().describe('Custom shader code (overrides template)'),
});

// Shader templates
const shaderTemplates: Record<string, Record<string, string>> = {
  spatial: {
    empty: `shader_type spatial;

void fragment() {
	ALBEDO = vec3(1.0, 1.0, 1.0);
}`,

    simple_color: `shader_type spatial;

uniform vec3 albedo_color : source_color = vec3(1.0, 1.0, 1.0);
uniform float metallic : hint_range(0, 1) = 0.0;
uniform float roughness : hint_range(0, 1) = 0.5;

void fragment() {
	ALBEDO = albedo_color;
	METALLIC = metallic;
	ROUGHNESS = roughness;
}`,

    textured: `shader_type spatial;

uniform sampler2D albedo_texture : source_color;
uniform sampler2D normal_texture;
uniform sampler2D metallic_texture;
uniform sampler2D roughness_texture;
uniform float normal_strength : hint_range(0, 2) = 1.0;

void fragment() {
	vec4 albedo_tex = texture(albedo_texture, UV);
	ALBEDO = albedo_tex.rgb;
	ALPHA = albedo_tex.a;
	
	NORMAL_MAP = texture(normal_texture, UV).rgb;
	NORMAL_MAP_DEPTH = normal_strength;
	
	METALLIC = texture(metallic_texture, UV).r;
	ROUGHNESS = texture(roughness_texture, UV).r;
}`,

    gradient: `shader_type spatial;
render_mode unshaded;

uniform vec3 top_color : source_color = vec3(0.2, 0.4, 0.8);
uniform vec3 bottom_color : source_color = vec3(0.8, 0.9, 1.0);
uniform float gradient_height : hint_range(0, 10) = 5.0;
uniform float gradient_offset : hint_range(-10, 10) = 0.0;

void fragment() {
	float height = (VERTEX.y + gradient_offset) / gradient_height;
	height = clamp(height, 0.0, 1.0);
	ALBEDO = mix(bottom_color, top_color, height);
}`,

    water: `shader_type spatial;
render_mode blend_mix, cull_disabled, depth_draw_always;

uniform vec4 water_color : source_color = vec4(0.2, 0.6, 0.9, 0.8);
uniform sampler2D noise_texture;
uniform float wave_speed : hint_range(0, 2) = 0.5;
uniform float wave_height : hint_range(0, 1) = 0.1;
uniform float wave_frequency : hint_range(0, 10) = 2.0;

void vertex() {
	vec4 noise = texture(noise_texture, UV * wave_frequency + TIME * wave_speed);
	VERTEX.y += noise.r * wave_height;
	NORMAL = normalize(vec3(0.0, 1.0, 0.0) + noise.rgb * 0.2);
}

void fragment() {
	ALBEDO = water_color.rgb;
	ALPHA = water_color.a;
	ROUGHNESS = 0.1;
	METALLIC = 0.0;
}`,
  },

  canvas_item: {
    empty: `shader_type canvas_item;

void fragment() {
	COLOR = texture(TEXTURE, UV);
}`,

    simple_color: `shader_type canvas_item;

uniform vec4 tint_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);

void fragment() {
	vec4 tex_color = texture(TEXTURE, UV);
	COLOR = tex_color * tint_color;
}`,

    gradient: `shader_type canvas_item;

uniform vec4 top_color : source_color = vec4(0.2, 0.4, 0.8, 1.0);
uniform vec4 bottom_color : source_color = vec4(0.8, 0.9, 1.0, 1.0);

void fragment() {
	float gradient = UV.y;
	COLOR = mix(bottom_color, top_color, gradient);
}`,

    glow: `shader_type canvas_item;

uniform float glow_strength : hint_range(0, 5) = 1.0;
uniform vec3 glow_color : source_color = vec3(1.0, 0.8, 0.2);

void fragment() {
	vec4 tex_color = texture(TEXTURE, UV);
	float brightness = (tex_color.r + tex_color.g + tex_color.b) / 3.0;
	vec3 glow = glow_color * brightness * glow_strength;
	COLOR = vec4(tex_color.rgb + glow, tex_color.a);
}`,
  },

  particles: {
    empty: `shader_type particles;

void vertex() {
	COLOR = vec4(1.0);
}`,

    fire: `shader_type particles;
render_mode blend_add, unshaded;

uniform sampler2D noise_texture;
uniform vec4 start_color : source_color = vec4(1.0, 0.5, 0.2, 1.0);
uniform vec4 end_color : source_color = vec4(0.2, 0.1, 0.0, 0.0);
uniform float noise_strength : hint_range(0, 2) = 0.5;

void vertex() {
	float lifetime_ratio = 1.0 - LIFETIME / LIFETIME_MAX;
	
	// Apply noise to position
	vec4 noise = texture(noise_texture, vec2(UV.x * 2.0, TIME * 0.5));
	VERTEX.xz += (noise.rg - 0.5) * noise_strength * lifetime_ratio;
	
	// Color based on lifetime
	COLOR = mix(end_color, start_color, lifetime_ratio);
	
	// Scale based on lifetime
	VERTEX *= lifetime_ratio;
}`,
  },

  sky: {
    empty: `shader_type sky;

void fragment() {
	COLOR = vec3(0.2, 0.4, 0.8);
}`,

    gradient_sky: `shader_type sky;

uniform vec3 horizon_color : source_color = vec3(0.8, 0.9, 1.0);
uniform vec3 zenith_color : source_color = vec3(0.2, 0.4, 0.8);
uniform vec3 ground_color : source_color = vec3(0.1, 0.3, 0.1);
uniform float horizon_height : hint_range(-1, 1) = 0.0;
uniform float horizon_sharpness : hint_range(0, 10) = 2.0;

void fragment() {
	float height = SKY_COORDS.y;
	
	// Sky gradient
	float sky_factor = smoothstep(horizon_height - horizon_sharpness, horizon_height + horizon_sharpness, height);
	vec3 sky_color = mix(horizon_color, zenith_color, sky_factor);
	
	// Ground
	float ground_factor = smoothstep(horizon_height, horizon_height - 0.1, height);
	vec3 final_color = mix(ground_color, sky_color, ground_factor);
	
	COLOR = final_color;
}`,
  },
};

// Helper to generate parameter declarations
function generateParameterDeclarations(parameters: Record<string, any>): string[] {
  const declarations: string[] = [];
  
  for (const [name, param] of Object.entries(parameters)) {
    let declaration = `uniform ${param.type} ${name}`;
    
    if (param.hint) {
      declaration += ` : hint_${param.hint}`;
      if (param.hint_string) {
        declaration += `(${param.hint_string})`;
      }
    }
    
    if (param.default !== undefined) {
      let defaultValue = param.default;
      
      // Format default values based on type
      if (param.type === 'color') {
        if (typeof defaultValue === 'string') {
          // Try to parse color string
          defaultValue = `vec${defaultValue.includes(',') ? defaultValue.split(',').length : 3}(${defaultValue})`;
        }
      } else if (param.type.startsWith('vec')) {
        if (typeof defaultValue === 'number') {
          const dim = parseInt(param.type.charAt(3));
          defaultValue = `vec${dim}(${defaultValue})`;
        }
      }
      
      declaration += ` = ${defaultValue}`;
    }
    
    declarations.push(declaration);
  }
  
  return declarations;
}

export function createCreateShaderTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_shader',
    name: 'Create Shader',
    description: 'Create a new shader file (.gdshader) with optional parameters and templates',
    category: 'assets',
    inputSchema: createShaderSchema,
    handler: async (args) => {
      let shaderContent = '';
      
      // Use custom code if provided
      if (args.customCode) {
        shaderContent = args.customCode;
      } else {
        // Get template based on shader type and template name
        const templateGroup = shaderTemplates[args.shaderType];
        if (!templateGroup) {
          throw new Error(`Unsupported shader type: ${args.shaderType}`);
        }
        
        let template = templateGroup[args.shaderTemplate];
        if (!template) {
          template = templateGroup.empty || shaderTemplates.spatial.empty;
        }
        
        // Build shader content
        const lines = template.split('\n');
        const shaderLines: string[] = [];
        
        // Add shader_type declaration
        let shaderTypeAdded = false;
        for (const line of lines) {
          if (line.trim().startsWith('shader_type')) {
            shaderTypeAdded = true;
            let shaderTypeLine = line;
            
            // Add render mode if specified
            if (args.renderMode) {
              shaderLines.push(shaderTypeLine);
              shaderLines.push(`render_mode ${args.renderMode};`);
              continue;
            }
          }
          shaderLines.push(line);
        }
        
        // Ensure shader_type is present
        if (!shaderTypeAdded) {
          shaderLines.unshift(`shader_type ${args.shaderType};`);
          if (args.renderMode) {
            shaderLines.splice(1, 0, `render_mode ${args.renderMode};`);
          }
        }
        
        // Add parameter declarations if provided
        if (args.parameters && Object.keys(args.parameters).length > 0) {
          const paramDeclarations = generateParameterDeclarations(args.parameters);
          
          // Insert after shader_type and render_mode
          let insertIndex = 0;
          for (let i = 0; i < shaderLines.length; i++) {
            if (shaderLines[i].trim().startsWith('shader_type') || 
                shaderLines[i].trim().startsWith('render_mode')) {
              insertIndex = i + 1;
            } else if (shaderLines[i].trim().length > 0 && 
                      !shaderLines[i].trim().startsWith('shader_type') && 
                      !shaderLines[i].trim().startsWith('render_mode')) {
              break;
            }
          }
          
          // Add blank line before parameters if needed
          if (insertIndex > 0 && shaderLines[insertIndex - 1].trim() !== '') {
            shaderLines.splice(insertIndex, 0, '');
            insertIndex++;
          }
          
          // Add parameters
          shaderLines.splice(insertIndex, 0, ...paramDeclarations);
          
          // Add blank line after parameters if needed
          if (shaderLines[insertIndex + paramDeclarations.length].trim() !== '') {
            shaderLines.splice(insertIndex + paramDeclarations.length, 0, '');
          }
        }
        
        shaderContent = shaderLines.join('\n');
      }
      
      // Write the shader file
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.shaderPath,
          content: shaderContent,
        },
      };
      
      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to create shader file: ${writeResult.error}`);
      }
      
      return {
        shaderPath: args.shaderPath,
        shaderType: args.shaderType,
        shaderTemplate: args.customCode ? 'custom' : args.shaderTemplate,
        renderMode: args.renderMode,
        parameterCount: args.parameters ? Object.keys(args.parameters).length : 0,
        contentLength: shaderContent.length,
        message: `Created ${args.shaderType} shader at ${args.shaderPath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}