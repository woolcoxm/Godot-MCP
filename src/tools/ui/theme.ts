import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const themeSchema = z.object({
  path: z.string().describe('Path to save the theme resource (e.g., "res://themes/default.tres")'),
  themeType: z.enum(['Theme', 'StyleBox', 'Font', 'Color']).default('Theme').describe('Type of theme resource to create'),
  baseTheme: z.string().optional().describe('Path to base theme to inherit from'),
  properties: z.record(z.string(), z.any()).optional().describe('Theme properties to set'),
  styles: z.record(z.string(), z.any()).optional().describe('Style definitions'),
  fonts: z.record(z.string(), z.any()).optional().describe('Font definitions'),
  colors: z.record(z.string(), z.string()).optional().describe('Color definitions (hex format)')
});

const applyThemeSchema = z.object({
  nodePath: z.string().describe('Path to the node to apply theme to'),
  themePath: z.string().describe('Path to the theme resource'),
  property: z.string().optional().describe('Specific theme property to apply (e.g., "theme_override_fonts/normal_font")'),
  value: z.any().optional().describe('Value to set for the property')
});

export function createThemeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_theme',
    name: 'Create Theme',
    description: 'Create or modify UI theme resources with styles, fonts, and colors.',
    category: 'ui',
    inputSchema: themeSchema,
    handler: async (args: any) => {
      return handleCreateTheme(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

export function createApplyThemeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_apply_theme',
    name: 'Apply Theme',
    description: 'Apply theme properties to UI nodes.',
    category: 'ui',
    inputSchema: applyThemeSchema,
    handler: async (args: any) => {
      return handleApplyTheme(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  };
}

async function handleCreateTheme(
  args: z.infer<typeof themeSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build theme data structure
    const themeData: Record<string, any> = {
      resource_type: 'Theme',
      base_theme: args.baseTheme || '',
      properties: args.properties || {}
    };
    
    // Add styles if provided
    if (args.styles) {
      themeData.styles = args.styles;
    }
    
    // Add fonts if provided
    if (args.fonts) {
      themeData.fonts = args.fonts;
    }
    
    // Add colors if provided (convert hex to Color)
    if (args.colors) {
      const colorData: Record<string, any> = {};
      for (const [key, hex] of Object.entries(args.colors)) {
        colorData[key] = hexToColor(hex);
      }
      themeData.colors = colorData;
    }
    
    // Create theme file
    const result = await transport.execute({
      operation: 'write_file',
      params: {
        path: args.path,
        content: JSON.stringify(themeData, null, 2)
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create theme: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created theme at: ${args.path}\nType: ${args.themeType}\nProperties: ${Object.keys(themeData).length}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating theme: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function handleApplyTheme(
  args: z.infer<typeof applyThemeSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties to modify
    const properties: Record<string, any> = {};
    
    if (args.property && args.value !== undefined) {
      properties[args.property] = args.value;
    } else {
      // Apply full theme
      properties.theme = args.themePath;
    }
    
    const result = await transport.execute({
      operation: 'modify_node',
      params: {
        nodePath: args.nodePath,
        properties
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to apply theme: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Applied theme to: ${args.nodePath}\nTheme: ${args.themePath}${args.property ? `\nProperty: ${args.property}` : ''}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error applying theme: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

function hexToColor(hex: string): { r: number; g: number; b: number; a: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  let r = 1, g = 1, b = 1, a = 1;
  
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  } else if (hex.length === 8) {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
    a = parseInt(hex.substring(6, 8), 16) / 255;
  }
  
  return { r, g, b, a };
}