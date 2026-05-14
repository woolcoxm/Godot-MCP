import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';
import { spawn } from 'child_process';
import { isPathSafe, isValidExecutable, sanitizeUserArguments } from '../../utils/security.js';


const launchEditorSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  editorPath: z.string().optional().describe('Path to Godot editor executable (default: auto-detect)'),
  args: z.array(z.string()).optional().describe('Additional command line arguments'),
  waitForConnection: z.boolean().optional().describe('Wait for editor WebSocket connection'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

const checkEditorStatusSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
});

const closeEditorSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  force: z.boolean().optional().describe('Force close editor'),
});

export function createLaunchEditorTool(_transport: Transport): RegisteredTool {
  let editorProcess: any = null;
  
  return {
    id: 'godot_launch_editor',
    name: 'LaunchEditor',
    description: 'Launch Godot editor with a project',
    category: 'editor',
    destructiveHint: false,
    readOnlyHint: false,
    idempotentHint: true,
    inputSchema: z.object({
      operation: z.enum(['launch', 'status', 'close']).describe('Operation to perform'),
      data: z.record(z.string(), z.any()).describe('Operation data'),
    }),
    handler: async (args: any) => {
      const { operation, data } = args;
      
      switch (operation) {
        case 'launch': {
          const validated = launchEditorSchema.parse(data);
          
          // Auto-detect Godot editor path if not provided
          let editorExecutable = validated.editorPath;
          if (!editorExecutable) {
            editorExecutable = 'godot';
          }
          
          // Security validation
          if (!isValidExecutable(editorExecutable)) {
            throw new Error(`Security Error: Invalid editor executable '${editorExecutable}'`);
          }

          if (!isPathSafe(validated.projectPath)) {
            throw new Error(`Security Error: Invalid project path '${validated.projectPath}'`);
          }

          // Build command arguments
          const safeArgs = sanitizeUserArguments(validated.args || []);
          const fullArgs = [validated.projectPath, ...safeArgs];
          
          // Launch editor
          editorProcess = spawn(editorExecutable, fullArgs, {
            stdio: 'inherit',
            detached: true,
          });
          
          editorProcess.on('error', (err: any) => {
            console.error(`[LaunchEditor] Failed to launch editor: ${err.message}`);
          });
          
          editorProcess.on('exit', (code: any) => {
            console.log(`[LaunchEditor] Editor exited with code ${code}`);
            editorProcess = null;
          });
          
          // Wait for connection if requested
          if (validated.waitForConnection) {
            const timeout = validated.timeout || 30000;
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
              try {
                // Try to connect to editor WebSocket
                // In a real implementation, we would attempt WebSocket connection
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if editor is responding
                // For now, assume success after a short delay
                break;
              } catch (err) {
                // Continue waiting
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `Launched Godot editor for project: ${validated.projectPath}`,
              },
            ],
          };
        }
        
        case 'status': {
          const validated = checkEditorStatusSchema.parse(data);
          
          const isRunning = editorProcess !== null && !editorProcess.killed;
          
          return {
            content: [
              {
                type: 'text',
                text: `Editor status for project ${validated.projectPath}: ${isRunning ? 'Running' : 'Not running'}`,
              },
            ],
          };
        }
        
        case 'close': {
          const validated = closeEditorSchema.parse(data);
          
          if (!editorProcess) {
            return {
              content: [
                {
                  type: 'text',
                  text: `No editor process found for project: ${validated.projectPath}`,
                },
              ],
            };
          }
          
          if (validated.force) {
            editorProcess.kill('SIGKILL');
          } else {
            editorProcess.kill('SIGTERM');
          }
          
          editorProcess = null;
          
          return {
            content: [
              {
                type: 'text',
                text: `Closed editor for project: ${validated.projectPath}`,
              },
            ],
          };
        }
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    },
  };
}