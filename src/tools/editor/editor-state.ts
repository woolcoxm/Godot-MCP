import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const getEditorStateSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  include: z.array(z.enum(['scene', 'selection', 'scripts', 'filesystem', 'plugins', 'settings'])).optional().describe('What to include in state'),
});

const setEditorSelectionSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  nodePaths: z.array(z.string()).describe('Paths to nodes to select'),
  scenePath: z.string().optional().describe('Scene path (if different from current)'),
});

const openSceneSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  scenePath: z.string().describe('Path to scene to open'),
  focus: z.boolean().optional().describe('Focus editor on this scene'),
});

const openScriptSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  scriptPath: z.string().describe('Path to script to open'),
  line: z.number().optional().describe('Line number to jump to'),
  column: z.number().optional().describe('Column number to jump to'),
});

export function createEditorStateTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_editor_state',
    name: 'EditorState',
    description: 'Query and control Godot editor state',
    category: 'editor',
    destructiveHint: false,
    readOnlyHint: false,
    idempotentHint: true,
    inputSchema: z.object({
      operation: z.enum(['get_state', 'set_selection', 'open_scene', 'open_script']).describe('Operation to perform'),
      data: z.record(z.string(), z.any()).optional().describe('Operation data'),
    }),
    handler: async (args: any) => {
      const { operation, data } = args;
      
      switch (operation) {
        case 'get_state': {
          const validated = getEditorStateSchema.parse(data);
          
          // In a real implementation, this would query the editor via WebSocket
          // For now, return mock data
          const include = validated.include || ['scene', 'selection', 'scripts'];
          
          const state: any = {
            project: validated.projectPath,
            timestamp: new Date().toISOString(),
          };
          
          if (include.includes('scene')) {
            state.currentScene = 'res://scenes/main.tscn';
            state.openScenes = ['res://scenes/main.tscn', 'res://scenes/ui.tscn'];
            state.sceneModified = false;
          }
          
          if (include.includes('selection')) {
            state.selection = ['/root/Main/Player', '/root/Main/World'];
            state.activeNode = '/root/Main/Player';
          }
          
          if (include.includes('scripts')) {
            state.openScripts = ['res://scripts/player.gd', 'res://scripts/world.gd'];
            state.activeScript = 'res://scripts/player.gd';
            state.scriptCursor = { line: 42, column: 10 };
          }
          
          if (include.includes('filesystem')) {
            state.filesystem = {
              currentPath: 'res://',
              selectedPaths: ['res://scripts/'],
              expandedPaths: ['res://scripts/', 'res://scenes/'],
            };
          }
          
          if (include.includes('plugins')) {
            state.plugins = {
              enabled: ['godot_mcp'],
              active: ['godot_mcp'],
            };
          }
          
          if (include.includes('settings')) {
            state.settings = {
              theme: 'dark',
              fontSize: 14,
              autoSave: true,
            };
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(state, null, 2),
              },
            ],
          };
        }
        
        case 'set_selection': {
          const validated = setEditorSelectionSchema.parse(data);
          
          // In a real implementation, this would send selection command to editor
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'set_selection',
              params: {
                nodePaths: validated.nodePaths,
                scenePath: validated.scenePath,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Set editor selection to ${validated.nodePaths.length} node(s)`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to set selection: ${err.message}`,
                },
              ],
            };
          }
        }
        
        case 'open_scene': {
          const validated = openSceneSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'open_scene',
              params: {
                scenePath: validated.scenePath,
                focus: validated.focus,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Opened scene: ${validated.scenePath}`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to open scene: ${err.message}`,
                },
              ],
            };
          }
        }
        
        case 'open_script': {
          const validated = openScriptSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'open_script',
              params: {
                scriptPath: validated.scriptPath,
                line: validated.line,
                column: validated.column,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Opened script: ${validated.scriptPath}${validated.line ? ` at line ${validated.line}` : ''}`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to open script: ${err.message}`,
                },
              ],
            };
          }
        }
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    },
  };
}