import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const textRangeSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  controlType: z.enum([
    'RichTextLabel', 'HSlider', 'VSlider', 'ProgressBar', 'SpinBox',
    'HSeparator', 'VSeparator', 'TextureProgressBar'
  ]).describe('Type of control to create'),
  name: z.string().optional().describe('Name for the control node'),
  size: z.object({
    x: z.number().optional().describe('Width'),
    y: z.number().optional().describe('Height')
  }).optional().describe('Control size'),
  position: z.object({
    x: z.number().optional().describe('X position'),
    y: z.number().optional().describe('Y position')
  }).optional().describe('Control position'),
  // Text controls
  text: z.string().optional().describe('Text content (for RichTextLabel)'),
  bbcodeEnabled: z.boolean().default(false).describe('Enable BBCode parsing (for RichTextLabel)'),
  scrollActive: z.boolean().default(true).describe('Enable scrolling (for RichTextLabel)'),
  // Range controls
  minValue: z.number().default(0).describe('Minimum value'),
  maxValue: z.number().default(100).describe('Maximum value'),
  step: z.number().default(1).describe('Step size'),
  value: z.number().optional().describe('Initial value'),
  expEdit: z.boolean().default(false).describe('Enable exponential editing (for SpinBox)'),
  allowGreater: z.boolean().default(true).describe('Allow values greater than max (for SpinBox)'),
  allowLesser: z.boolean().default(true).describe('Allow values less than min (for SpinBox)'),
  rounded: z.boolean().default(false).describe('Round values (for Slider)'),
  tickCount: z.number().min(0).default(0).describe('Number of ticks to display (for Slider)'),
  // Progress bar
  showPercentage: z.boolean().default(false).describe('Show percentage text (for ProgressBar)'),
  fillMode: z.enum(['BeginToEnd', 'EndToBegin', 'TopToBottom', 'BottomToTop']).default('BeginToEnd').describe('Fill direction'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createTextRangeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_text_range',
    name: 'Create Text/Range Controls',
    description: 'Create RichTextLabel, Sliders, ProgressBar, SpinBox, and other text/range controls.',
    category: 'ui',
    inputSchema: textRangeSchema,
    handler: async (args: any) => {
      return handleCreateTextRange(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleCreateTextRange(
  args: z.infer<typeof textRangeSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add text properties for RichTextLabel
    if (args.controlType === 'RichTextLabel') {
      if (args.text !== undefined) {
        properties.text = args.text;
      }
      properties.bbcode_enabled = args.bbcodeEnabled;
      properties.scroll_active = args.scrollActive;
    }
    
    // Add range properties for sliders, progress bars, spin boxes
    if (['HSlider', 'VSlider', 'ProgressBar', 'SpinBox', 'TextureProgressBar'].includes(args.controlType)) {
      properties.min_value = args.minValue;
      properties.max_value = args.maxValue;
      properties.step = args.step;
      
      if (args.value !== undefined) {
        properties.value = args.value;
      }
      
      // Control-specific properties
      if (args.controlType === 'SpinBox') {
        properties.exp_edit = args.expEdit;
        properties.allow_greater = args.allowGreater;
        properties.allow_lesser = args.allowLesser;
      }
      
      if (args.controlType === 'HSlider' || args.controlType === 'VSlider') {
        properties.rounded = args.rounded;
        properties.tick_count = args.tickCount;
      }
      
      if (args.controlType === 'ProgressBar' || args.controlType === 'TextureProgressBar') {
        properties.show_percentage = args.showPercentage;
        
        // Map fill mode to Godot property
        const fillModeMap = {
          'BeginToEnd': 0,   // FILL_BEGIN_TO_END
          'EndToBegin': 1,   // FILL_END_TO_BEGIN
          'TopToBottom': 2,  // FILL_TOP_TO_BOTTOM
          'BottomToTop': 3   // FILL_BOTTOM_TO_TOP
        };
        properties.fill_mode = fillModeMap[args.fillMode];
      }
    }
    
    // Add size if provided
    if (args.size) {
      properties.size = args.size;
    }
    
    // Add position if provided
    if (args.position) {
      properties.position = args.position;
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
          text: `Failed to create ${args.controlType}: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created ${args.controlType}: ${args.name || 'Unnamed'}\nPath: ${result.data?.path || 'Unknown'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating ${args.controlType}: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}