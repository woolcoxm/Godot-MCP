import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const treeItemListSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  controlType: z.enum(['Tree', 'ItemList']).describe('Type of control to create'),
  name: z.string().optional().describe('Name for the control node'),
  size: z.object({
    x: z.number().optional().describe('Width'),
    y: z.number().optional().describe('Height')
  }).optional().describe('Control size'),
  position: z.object({
    x: z.number().optional().describe('X position'),
    y: z.number().optional().describe('Y position')
  }).optional().describe('Control position'),
  columns: z.number().min(1).max(10).default(1).describe('Number of columns (for Tree)'),
  allowReselect: z.boolean().default(false).describe('Allow reselecting already selected items'),
  allowRmbSelect: z.boolean().default(false).describe('Allow right mouse button selection'),
  hideRoot: z.boolean().default(false).describe('Hide root item (for Tree)'),
  selectMode: z.enum(['Single', 'Row', 'Multi']).default('Single').describe('Selection mode'),
  items: z.array(z.object({
    text: z.string().describe('Item text'),
    icon: z.string().optional().describe('Icon resource path'),
    disabled: z.boolean().default(false).describe('Whether item is disabled'),
    selectable: z.boolean().default(true).describe('Whether item is selectable'),
    children: z.array(z.any()).optional().describe('Child items (for Tree)')
  })).optional().describe('Initial items to add'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createTreeItemListTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_tree_itemlist',
    name: 'Create Tree/ItemList',
    description: 'Create Tree or ItemList controls for hierarchical or list-based UI.',
    category: 'ui',
    inputSchema: treeItemListSchema,
    handler: async (args: any) => {
      return handleCreateTreeItemList(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleCreateTreeItemList(
  args: z.infer<typeof treeItemListSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add control-specific properties
    if (args.controlType === 'Tree') {
      properties.columns = args.columns;
      properties.hide_root = args.hideRoot;
    }
    
    properties.allow_reselect = args.allowReselect;
    properties.allow_rmb_select = args.allowRmbSelect;
    
    // Map select mode to Godot property
    const selectModeMap = {
      'Single': 0, // ItemList.SELECT_SINGLE
      'Row': 1,    // Tree.SELECT_ROW
      'Multi': 2   // ItemList.SELECT_MULTI
    };
    properties.select_mode = selectModeMap[args.selectMode];
    
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
    
    // If items were provided, we would need to add them after creation
    // This would require additional operations to populate the control
    if (args.items && args.items.length > 0) {
      response += `\nNote: ${args.items.length} items defined (need separate operation to populate)`;
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