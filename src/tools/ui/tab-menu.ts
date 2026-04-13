import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const tabMenuSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  controlType: z.enum(['TabContainer', 'TabBar', 'MenuBar']).describe('Type of control to create'),
  name: z.string().optional().describe('Name for the control node'),
  size: z.object({
    x: z.number().optional().describe('Width'),
    y: z.number().optional().describe('Height')
  }).optional().describe('Control size'),
  position: z.object({
    x: z.number().optional().describe('X position'),
    y: z.number().optional().describe('Y position')
  }).optional().describe('Control position'),
  tabs: z.array(z.object({
    title: z.string().describe('Tab title'),
    icon: z.string().optional().describe('Icon resource path'),
    disabled: z.boolean().default(false).describe('Whether tab is disabled'),
    tooltip: z.string().optional().describe('Tooltip text')
  })).optional().describe('Initial tabs to add (for TabContainer/TabBar)'),
  menuItems: z.array(z.object({
    text: z.string().describe('Menu item text'),
    shortcut: z.string().optional().describe('Keyboard shortcut (e.g., "Ctrl+S")'),
    icon: z.string().optional().describe('Icon resource path'),
    disabled: z.boolean().default(false).describe('Whether menu item is disabled'),
    checkable: z.boolean().default(false).describe('Whether menu item is checkable'),
    submenu: z.array(z.any()).optional().describe('Submenu items')
  })).optional().describe('Initial menu items (for MenuBar)'),
  tabAlignment: z.enum(['Left', 'Center', 'Right', 'Fill']).default('Left').describe('Tab alignment'),
  currentTab: z.number().min(0).default(0).describe('Initially selected tab index'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createTabMenuTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_tab_menu',
    name: 'Create Tab/Menu Controls',
    description: 'Create TabContainer, TabBar, or MenuBar controls for tabbed interfaces and menus.',
    category: 'ui',
    inputSchema: tabMenuSchema,
    handler: async (args: any) => {
      return handleCreateTabMenu(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleCreateTabMenu(
  args: z.infer<typeof tabMenuSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add control-specific properties
    if (args.controlType === 'TabContainer' || args.controlType === 'TabBar') {
      // Map alignment to Godot property
      const alignmentMap = {
        'Left': 0,   // ALIGN_BEGIN
        'Center': 1, // ALIGN_CENTER
        'Right': 2,  // ALIGN_END
        'Fill': 3    // ALIGN_FILL
      };
      properties.tab_alignment = alignmentMap[args.tabAlignment];
      properties.current_tab = args.currentTab;
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
    
    // Note about tabs/menu items
    if (args.controlType === 'TabContainer' || args.controlType === 'TabBar') {
      if (args.tabs && args.tabs.length > 0) {
        response += `\nNote: ${args.tabs.length} tabs defined (need separate operation to populate)`;
      }
    } else if (args.controlType === 'MenuBar') {
      if (args.menuItems && args.menuItems.length > 0) {
        response += `\nNote: ${args.menuItems.length} menu items defined (need separate operation to populate)`;
      }
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