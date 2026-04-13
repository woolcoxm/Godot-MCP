import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const controlSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  controlType: z.enum([
    'Button', 'Label', 'LineEdit', 'TextEdit', 'CheckBox', 'OptionButton', 
    'Slider', 'ProgressBar', 'SpinBox', 'HSlider', 'VSlider', 'HSeparator', 
    'VSeparator', 'TextureRect', 'ColorRect', 'NinePatchRect', 'Panel', 
    'PanelContainer', 'MarginContainer', 'CenterContainer', 'ScrollContainer',
    'HBoxContainer', 'VBoxContainer', 'GridContainer', 'TabContainer'
  ]).describe('Type of UI control to create'),
  name: z.string().optional().describe('Name for the control node'),
  text: z.string().optional().describe('Text content (for Label, Button, etc.)'),
  size: z.object({
    x: z.number().optional().describe('Width'),
    y: z.number().optional().describe('Height')
  }).optional().describe('Control size'),
  position: z.object({
    x: z.number().optional().describe('X position'),
    y: z.number().optional().describe('Y position')
  }).optional().describe('Control position'),
  anchor: z.object({
    left: z.number().optional().describe('Left anchor (0-1)'),
    top: z.number().optional().describe('Top anchor (0-1)'),
    right: z.number().optional().describe('Right anchor (0-1)'),
    bottom: z.number().optional().describe('Bottom anchor (0-1)')
  }).optional().describe('Anchor points (0-1 range)'),
  margin: z.object({
    left: z.number().optional().describe('Left margin'),
    top: z.number().optional().describe('Top margin'),
    right: z.number().optional().describe('Right margin'),
    bottom: z.number().optional().describe('Bottom margin')
  }).optional().describe('Margin values'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createControlTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_control',
    name: 'Create UI Control',
    description: 'Create a UI control node (Button, Label, Slider, etc.) with common properties.',
    category: 'ui',
    inputSchema: controlSchema,
    handler: async (args: any) => {
      return handleCreateControl(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  };
}

async function handleCreateControl(
  args: z.infer<typeof controlSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add text property if provided
    if (args.text !== undefined) {
      properties.text = args.text;
    }
    
    // Add size if provided
    if (args.size) {
      properties.size = args.size;
    }
    
    // Add position if provided
    if (args.position) {
      properties.position = args.position;
    }
    
    // Add anchor if provided
    if (args.anchor) {
      properties.anchor_left = args.anchor.left;
      properties.anchor_top = args.anchor.top;
      properties.anchor_right = args.anchor.right;
      properties.anchor_bottom = args.anchor.bottom;
    }
    
    // Add margin if provided
    if (args.margin) {
      properties.margin_left = args.margin.left;
      properties.margin_top = args.margin.top;
      properties.margin_right = args.margin.right;
      properties.margin_bottom = args.margin.bottom;
    }
    
    const result = await transport.execute({
      operation: 'create_node',
      params: {
        parentPath: args.parentPath,
        nodeType: args.controlType,
        name: args.name,
        properties
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create control: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created ${args.controlType} control: ${args.name || 'Unnamed'}\nPath: ${result.data?.path || 'Unknown'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating control: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}