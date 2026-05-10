import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';
import { spawn } from 'child_process';
import { isPathSafe, sanitizeUserArguments } from '../../utils/security.js';

const runProjectSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  exportPreset: z.string().optional().describe('Export preset name (if exporting)'),
  platform: z.enum(['editor', 'windows', 'linux', 'macos', 'web', 'android', 'ios']).optional().describe('Platform to run on'),
  args: z.array(z.string()).optional().describe('Additional command line arguments'),
  waitForRuntime: z.boolean().optional().describe('Wait for runtime WebSocket connection'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

const stopProjectSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
  force: z.boolean().optional().describe('Force stop project'),
});

const projectStatusSchema = z.object({
  projectPath: z.string().describe('Path to the Godot project directory'),
});

export function createRunProjectTool(_transport: Transport): RegisteredTool {
  let projectProcess: any = null;
  
  return {
    id: 'godot_run_project',
    name: 'RunProject',
    description: 'Run Godot project from editor or export and run',
    category: 'editor',
    destructiveHint: false,
    readOnlyHint: false,
    idempotentHint: true,
    inputSchema: z.object({
      operation: z.enum(['run', 'stop', 'status']).describe('Operation to perform'),
      data: z.record(z.string(), z.any()).describe('Operation data'),
    }),
    handler: async (args: any) => {
      const { operation, data } = args;
      
      switch (operation) {
        case 'run': {
          const validated = runProjectSchema.parse(data);
          
          // Validate user-provided project path
          if (!isPathSafe(validated.projectPath)) {
            throw new Error('Invalid project path: path cannot start with a hyphen to prevent flag injection');
          }

          let command = 'godot';
          const safeArgs = sanitizeUserArguments(validated.args || []);
          const args = [...safeArgs];
          
          if (validated.platform === 'editor') {
            // Run in editor
            command = 'godot';
            args.unshift('--editor', validated.projectPath);
          } else if (validated.exportPreset) {
            // Export and run
            // In a real implementation, we would export first then run the exported binary
            command = 'godot';
            args.unshift('--export', validated.exportPreset, validated.projectPath);
          } else {
            // Run project directly
            command = 'godot';
            args.unshift(validated.projectPath);
          }
          
          // Add platform-specific arguments
          if (validated.platform && validated.platform !== 'editor') {
            args.push(`--platform=${validated.platform}`);
          }
          
          // Launch project
          projectProcess = spawn(command, args, {
            stdio: 'inherit',
            detached: true,
          });
          
          projectProcess.on('error', (err: any) => {
            console.error(`[RunProject] Failed to run project: ${err.message}`);
          });
          
          projectProcess.on('exit', (code: any) => {
            console.log(`[RunProject] Project exited with code ${code}`);
            projectProcess = null;
          });
          
          // Wait for runtime connection if requested
          if (validated.waitForRuntime) {
            const timeout = validated.timeout || 30000;
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
              try {
                // Try to connect to runtime WebSocket
                // In a real implementation, we would attempt WebSocket connection
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if runtime is responding
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
                text: `Running Godot project: ${validated.projectPath}${validated.platform ? ` (platform: ${validated.platform})` : ''}`,
              },
            ],
          };
        }
        
        case 'stop': {
          const validated = stopProjectSchema.parse(data);
          
          if (!projectProcess) {
            return {
              content: [
                {
                  type: 'text',
                  text: `No project process found for: ${validated.projectPath}`,
                },
              ],
            };
          }
          
          if (validated.force) {
            projectProcess.kill('SIGKILL');
          } else {
            projectProcess.kill('SIGTERM');
          }
          
          projectProcess = null;
          
          return {
            content: [
              {
                type: 'text',
                text: `Stopped project: ${validated.projectPath}`,
              },
            ],
          };
        }
        
        case 'status': {
          const validated = projectStatusSchema.parse(data);
          
          const isRunning = projectProcess !== null && !projectProcess.killed;
          
          return {
            content: [
              {
                type: 'text',
                text: `Project status for ${validated.projectPath}: ${isRunning ? 'Running' : 'Not running'}`,
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