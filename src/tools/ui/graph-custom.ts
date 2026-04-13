import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const graphCustomSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  controlType: z.enum(['GraphEdit', 'GraphNode', 'Control']).describe('Type of control to create'),
  name: z.string().optional().describe('Name for the control node'),
  size: z.object({
    x: z.number().optional().describe('Width'),
    y: z.number().optional().describe('Height')
  }).optional().describe('Control size'),
  position: z.object({
    x: z.number().optional().describe('X position'),
    y: z.number().optional().describe('Y position')
  }).optional().describe('Control position'),
  // GraphEdit properties
  rightDisconnects: z.boolean().default(false).describe('Allow right-click to disconnect (GraphEdit)'),
  connectionLinesCurvature: z.number().min(0).max(1).default(0.5).describe('Connection line curvature (0-1)'),
  connectionLinesThickness: z.number().min(1).default(2).describe('Connection line thickness'),
  zoom: z.number().min(0.01).max(4).default(1).describe('Zoom level'),
  snapDistance: z.number().min(1).default(20).describe('Snap distance in pixels'),
  // GraphNode properties
  title: z.string().optional().describe('Node title (for GraphNode)'),
  showClose: z.boolean().default(false).describe('Show close button (for GraphNode)'),
  resizable: z.boolean().default(false).describe('Whether node is resizable (for GraphNode)'),
  draggable: z.boolean().default(true).describe('Whether node is draggable (for GraphNode)'),
  slots: z.array(z.object({
    type: z.enum(['input', 'output']).describe('Slot type'),
    colorLeft: z.string().optional().describe('Left color (hex or named color)'),
    colorRight: z.string().optional().describe('Right color (hex or named color)'),
    typeLeft: z.number().default(0).describe('Left type (0-7)'),
    typeRight: z.number().default(0).describe('Right type (0-7)'),
    enabled: z.boolean().default(true).describe('Whether slot is enabled')
  })).optional().describe('Connection slots (for GraphNode)'),
  // Custom Control properties
  scriptPath: z.string().optional().describe('Custom script to attach (for Control)'),
  customProperties: z.record(z.string(), z.any()).optional().describe('Custom properties to set'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional built-in properties')
});

export function createGraphCustomTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_graph_custom',
    name: 'Create Graph/Custom Controls',
    description: 'Create GraphEdit, GraphNode for visual scripting, or custom Control nodes.',
    category: 'ui',
    inputSchema: graphCustomSchema,
    handler: async (args: any) => {
      return handleCreateGraphCustom(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleCreateGraphCustom(
  args: z.infer<typeof graphCustomSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add GraphEdit properties
    if (args.controlType === 'GraphEdit') {
      properties.right_disconnects = args.rightDisconnects;
      properties.connection_lines_curvature = args.connectionLinesCurvature;
      properties.connection_lines_thickness = args.connectionLinesThickness;
      properties.zoom = args.zoom;
      properties.snap_distance = args.snapDistance;
    }
    
    // Add GraphNode properties
    if (args.controlType === 'GraphNode') {
      if (args.title !== undefined) {
        properties.title = args.title;
      }
      properties.show_close = args.showClose;
      properties.resizable = args.resizable;
      properties.draggable = args.draggable;
      
      // Note: Slots would need to be added after creation via separate operations
    }
    
    // Add custom script if provided for Control
    if (args.controlType === 'Control' && args.scriptPath) {
      properties.script = args.scriptPath;
    }
    
    // Add custom properties
    if (args.customProperties) {
      Object.assign(properties, args.customProperties);
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

    let response = `Created ${args.controlType}: ${args.name || 'Unnamed'}\nPath: ${result.data?.path || 'Unknown'}`;
    
    // Add notes about additional setup needed
    if (args.controlType === 'GraphNode' && args.slots && args.slots.length > 0) {
      response += `\nNote: ${args.slots.length} slots defined (need separate operation to configure)`;
    }
    
    if (args.controlType === 'Control' && args.scriptPath) {
      response += `\nCustom script attached: ${args.scriptPath}`;
    }

    return {
      content: [{
        type: 'text',
        text: response
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