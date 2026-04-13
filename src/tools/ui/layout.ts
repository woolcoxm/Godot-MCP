import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const layoutSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node'),
  containerType: z.enum([
    'HBoxContainer', 'VBoxContainer', 'GridContainer', 'CenterContainer',
    'MarginContainer', 'ScrollContainer', 'PanelContainer', 'TabContainer'
  ]).describe('Type of layout container'),
  name: z.string().optional().describe('Name for the container node'),
  alignment: z.enum(['begin', 'center', 'end', 'fill']).optional().describe('Child alignment'),
  separation: z.number().optional().describe('Separation between children'),
  columns: z.number().optional().describe('Number of columns (for GridContainer)'),
  margins: z.object({
    left: z.number().optional().describe('Left margin'),
    top: z.number().optional().describe('Top margin'),
    right: z.number().optional().describe('Right margin'),
    bottom: z.number().optional().describe('Bottom margin')
  }).optional().describe('Margin values'),
  sizeFlags: z.object({
    horizontal: z.enum(['fill', 'expand', 'shrink_center', 'shrink_end']).optional().describe('Horizontal size flag'),
    vertical: z.enum(['fill', 'expand', 'shrink_center', 'shrink_end']).optional().describe('Vertical size flag')
  }).optional().describe('Size flags for the container'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

const arrangeSchema = z.object({
  containerPath: z.string().describe('Path to the container node'),
  children: z.array(z.string()).describe('Paths to child nodes to arrange'),
  arrangement: z.enum(['horizontal', 'vertical', 'grid', 'stack']).describe('Arrangement type'),
  options: z.object({
    spacing: z.number().optional().describe('Spacing between children'),
    alignment: z.string().optional().describe('Alignment within container'),
    wrap: z.boolean().optional().describe('Wrap to next line/column (for grid)'),
    maxColumns: z.number().optional().describe('Maximum columns (for grid)')
  }).optional().describe('Arrangement options')
});

export function createLayoutTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_layout',
    name: 'Create Layout Container',
    description: 'Create layout containers for organizing UI controls (HBox, VBox, Grid, etc.).',
    category: 'ui',
    inputSchema: layoutSchema,
    handler: async (args: any) => {
      return handleCreateLayout(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

export function createArrangeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_arrange_ui',
    name: 'Arrange UI Elements',
    description: 'Arrange UI elements within containers using layout rules.',
    category: 'ui',
    inputSchema: arrangeSchema,
    handler: async (args: any) => {
      return handleArrangeUI(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  };
}

async function handleCreateLayout(
  args: z.infer<typeof layoutSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add alignment if provided
    if (args.alignment) {
      properties.alignment = args.alignment;
    }
    
    // Add separation if provided
    if (args.separation !== undefined) {
      properties.separation = args.separation;
    }
    
    // Add columns for GridContainer
    if (args.containerType === 'GridContainer' && args.columns !== undefined) {
      properties.columns = args.columns;
    }
    
    // Add margins if provided
    if (args.margins) {
      if (args.containerType === 'MarginContainer') {
        properties['custom_constants/margin_left'] = args.margins.left || 0;
        properties['custom_constants/margin_top'] = args.margins.top || 0;
        properties['custom_constants/margin_right'] = args.margins.right || 0;
        properties['custom_constants/margin_bottom'] = args.margins.bottom || 0;
      }
    }
    
    // Add size flags if provided
    if (args.sizeFlags) {
      if (args.sizeFlags.horizontal) {
        properties.size_flags_horizontal = mapSizeFlag(args.sizeFlags.horizontal);
      }
      if (args.sizeFlags.vertical) {
        properties.size_flags_vertical = mapSizeFlag(args.sizeFlags.vertical);
      }
    }
    
    const result = await transport.execute({
      operation: 'create_node',
      params: {
        parentPath: args.parentPath,
        nodeType: args.containerType,
        name: args.name,
        properties
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create layout: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created ${args.containerType} layout: ${args.name || 'Unnamed'}\nPath: ${result.data?.path || 'Unknown'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating layout: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function handleArrangeUI(
  args: z.infer<typeof arrangeSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // For each child, set layout properties
    const updates = [];
    
    for (let i = 0; i < args.children.length; i++) {
      const childPath = args.children[i];
      const properties: Record<string, any> = {};
      
      // Set size flags based on arrangement
      switch (args.arrangement) {
        case 'horizontal':
          properties.size_flags_horizontal = 3; // Fill + Expand
          properties.size_flags_vertical = 3; // Fill + Expand
          break;
        case 'vertical':
          properties.size_flags_horizontal = 3;
          properties.size_flags_vertical = 3;
          break;
        case 'grid':
          properties.size_flags_horizontal = 3;
          properties.size_flags_vertical = 3;
          break;
        case 'stack':
          properties.size_flags_horizontal = 3;
          properties.size_flags_vertical = 3;
          break;
      }
      
      // Add custom properties based on options
      if (args.options) {
        if (args.options.spacing !== undefined) {
          // This would typically be set on the container, not individual children
        }
      }
      
      updates.push(
        transport.execute({
          operation: 'modify_node',
          params: {
            nodePath: childPath,
            properties
          }
        })
      );
    }
    
    // Execute all updates
    const results = await Promise.all(updates);
    const failed = results.filter(r => !r.success);
    
    if (failed.length > 0) {
      return {
        content: [{
          type: 'text',
          text: `Failed to arrange some elements: ${failed.map(f => f.error).join(', ')}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Arranged ${args.children.length} elements in ${args.containerPath}\nArrangement: ${args.arrangement}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error arranging UI: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

function mapSizeFlag(flag: string): number {
  const flags: Record<string, number> = {
    'fill': 1,
    'expand': 2,
    'shrink_center': 4,
    'shrink_end': 8
  };
  return flags[flag] || 1; // Default to fill
}