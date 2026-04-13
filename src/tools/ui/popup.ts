import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const popupSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  popupType: z.enum([
    'Popup', 'PopupMenu', 'PopupPanel', 'ConfirmationDialog', 
    'AcceptDialog', 'FileDialog', 'ColorPickerDialog', 'FontDialog'
  ]).describe('Type of popup/dialog to create'),
  name: z.string().optional().describe('Name for the popup node'),
  title: z.string().optional().describe('Title text for dialog windows'),
  size: z.object({
    x: z.number().optional().describe('Width'),
    y: z.number().optional().describe('Height')
  }).optional().describe('Popup size'),
  position: z.object({
    x: z.number().optional().describe('X position'),
    y: z.number().optional().describe('Y position')
  }).optional().describe('Popup position'),
  modal: z.boolean().default(true).describe('Whether the popup is modal (blocks input to other windows)'),
  exclusive: z.boolean().default(false).describe('Whether the popup is exclusive (closes other popups)'),
  resizable: z.boolean().default(false).describe('Whether the popup is resizable'),
  closable: z.boolean().default(true).describe('Whether the popup has a close button'),
  buttons: z.array(z.string()).optional().describe('Button texts for dialogs (e.g., ["OK", "Cancel"])'),
  filters: z.array(z.string()).optional().describe('File filters for FileDialog (e.g., ["*.png;PNG Images", "*.gd;GDScript Files"])'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createPopupTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_popup',
    name: 'Create Popup/Dialog',
    description: 'Create popup windows, menus, and dialogs (PopupMenu, ConfirmationDialog, FileDialog, etc.).',
    category: 'ui',
    inputSchema: popupSchema,
    handler: async (args: any) => {
      return handleCreatePopup(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleCreatePopup(
  args: z.infer<typeof popupSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add dialog-specific properties
    if (args.title !== undefined) {
      properties.window_title = args.title;
    }
    
    if (args.modal !== undefined) {
      properties.exclusive = args.exclusive;
    }
    
    if (args.exclusive !== undefined) {
      properties.exclusive = args.exclusive;
    }
    
    if (args.resizable !== undefined) {
      properties.resizable = args.resizable;
    }
    
    if (args.closable !== undefined) {
      properties.close_button = args.closable;
    }
    
    // Add size if provided
    if (args.size) {
      properties.size = args.size;
    }
    
    // Add position if provided
    if (args.position) {
      properties.position = args.position;
    }
    
    // Handle dialog-specific properties
    if (args.popupType === 'FileDialog' && args.filters) {
      properties.filters = args.filters;
    }
    
    if ((args.popupType === 'ConfirmationDialog' || args.popupType === 'AcceptDialog') && args.buttons) {
      // For dialogs with buttons
      properties.dialog_text = args.title || '';
      properties.dialog_buttons = args.buttons;
    }

    const result = await transport.execute({
      operation: 'create_node',
      params: {
        parentPath: args.parentPath,
        nodeType: args.popupType,
        name: args.name,
        properties
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create popup: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created ${args.popupType}: ${args.name || 'Unnamed'}\nPath: ${result.data?.path || 'Unknown'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating popup: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}