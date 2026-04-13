import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const scanFilesystemSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  path: z.string().optional().describe('Directory path to scan (default: project root)'),
  recursive: z.boolean().optional().describe('Scan recursively'),
  filter: z.string().optional().describe('File filter (e.g., "*.gd,*.tscn")'),
  includeHidden: z.boolean().optional().describe('Include hidden files'),
});

const navigateFilesystemSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  path: z.string().describe('Path to navigate to'),
  expand: z.boolean().optional().describe('Expand directory in editor'),
});

const createFileSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  path: z.string().describe('Path for new file'),
  type: z.enum(['scene', 'script', 'resource', 'folder', 'other']).describe('File type'),
  content: z.string().optional().describe('File content'),
  template: z.string().optional().describe('Template to use'),
});

const deleteFileSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  path: z.string().describe('Path to file or directory to delete'),
  force: z.boolean().optional().describe('Force delete (no confirmation)'),
});

const moveFileSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  sourcePath: z.string().describe('Source path'),
  destinationPath: z.string().describe('Destination path'),
  overwrite: z.boolean().optional().describe('Overwrite if exists'),
});

const importAssetSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  sourcePath: z.string().describe('Source file path'),
  destinationPath: z.string().describe('Destination path in project'),
  importSettings: z.record(z.string(), z.any()).optional().describe('Import settings'),
});

export function createFilesystemTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_editor_filesystem',
    name: 'EditorFilesystem',
    description: 'Browse and manipulate Godot editor filesystem',
    category: 'editor',
    destructiveHint: false,
    readOnlyHint: false,
    idempotentHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['scan', 'navigate', 'create', 'delete', 'move', 'import'],
          description: 'Operation to perform',
        },
        data: {
          type: 'object',
          description: 'Operation data',
        },
      },
      required: ['operation', 'data'],
    },
    handler: async (args: any) => {
      const { operation, data } = args;
      
      switch (operation) {
        case 'scan': {
          const validated = scanFilesystemSchema.parse(data);
          
          // In a real implementation, this would query editor filesystem
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'scan_filesystem',
              params: {
                path: validated.path || 'res://',
                recursive: validated.recursive,
                filter: validated.filter,
                includeHidden: validated.includeHidden,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            
            // Format result
            const files = result.data?.files || [];
            const directories = result.data?.directories || [];
            
            let output = `Filesystem scan of ${validated.path || 'res://'}:\n\n`;
            output += `Directories (${directories.length}):\n`;
            directories.forEach((dir: string) => {
              output += `  📁 ${dir}\n`;
            });
            
            output += `\nFiles (${files.length}):\n`;
            files.forEach((file: string) => {
              const ext = file.split('.').pop();
              let icon = '📄';
              if (ext === 'tscn') icon = '🎬';
              if (ext === 'gd') icon = '📜';
              if (ext === 'tres') icon = '📦';
              if (ext === 'png' || ext === 'jpg') icon = '🖼️';
              output += `  ${icon} ${file}\n`;
            });
            
            return {
              content: [
                {
                  type: 'text',
                  text: output,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to scan filesystem: ${err.message}`,
                },
              ],
            };
          }
        }
        
        case 'navigate': {
          const validated = navigateFilesystemSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'navigate_filesystem',
              params: {
                path: validated.path,
                expand: validated.expand,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Navigated to: ${validated.path}`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to navigate: ${err.message}`,
                },
              ],
            };
          }
        }
        
        case 'create': {
          const validated = createFileSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'create_file',
              params: {
                path: validated.path,
                type: validated.type,
                content: validated.content,
                template: validated.template,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Created ${validated.type} file: ${validated.path}`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to create file: ${err.message}`,
                },
              ],
            };
          }
        }
        
        case 'delete': {
          const validated = deleteFileSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'delete_file',
              params: {
                path: validated.path,
                force: validated.force,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Deleted: ${validated.path}`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to delete: ${err.message}`,
                },
              ],
            };
          }
        }
        
        case 'move': {
          const validated = moveFileSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'move_file',
              params: {
                sourcePath: validated.sourcePath,
                destinationPath: validated.destinationPath,
                overwrite: validated.overwrite,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Moved ${validated.sourcePath} to ${validated.destinationPath}`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to move file: ${err.message}`,
                },
              ],
            };
          }
        }
        
        case 'import': {
          const validated = importAssetSchema.parse(data);
          
          const op: TransportOperation = {
            type: 'editor_operation',
            data: {
              operation: 'import_asset',
              params: {
                sourcePath: validated.sourcePath,
                destinationPath: validated.destinationPath,
                importSettings: validated.importSettings,
              },
            },
          };
          
          try {
            const result = await transport.execute(op);
            return {
              content: [
                {
                  type: 'text',
                  text: `Imported ${validated.sourcePath} to ${validated.destinationPath}`,
                },
              ],
            };
          } catch (err: any) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Failed to import asset: ${err.message}`,
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