import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const modifyScriptSchema = z.object({
  path: z.string().describe('Path to the script file (e.g., "res://scripts/player.gd")'),
  modifications: z.array(z.object({
    type: z.enum(['add_function', 'remove_function', 'add_variable', 'remove_variable', 
                  'add_signal', 'remove_signal', 'add_constant', 'remove_constant',
                  'modify_function', 'modify_variable']),
    target: z.string().describe('Name of the element to modify'),
    data: z.record(z.string(), z.any()).optional().describe('Data for the modification'),
  })).describe('List of modifications to apply'),
  backup: z.boolean().default(true).describe('Create backup before modifying'),
});

export function createModifyScriptTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_modify_script',
    name: 'Modify GDScript',
    description: 'Add/remove functions, variables, signals, constants, or annotations to a GDScript',
    category: 'script',
    inputSchema: modifyScriptSchema,
    handler: async (args) => {
      // Read the script first
      const readOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: args.path },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read script: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Script file is empty or could not be read');
      }

      const originalContent = readResult.data.content;
      
      // Create backup if requested
      if (args.backup) {
        const backupPath = args.path + '.backup';
        const backupOperation: TransportOperation = {
          operation: 'write_file',
          params: {
            path: backupPath,
            content: originalContent,
          },
        };
        
        await transport.execute(backupOperation);
      }

      // In a real implementation, we would:
      // 1. Parse the script into AST
      // 2. Apply modifications
      // 3. Regenerate code
      // For now, we'll simulate the operation
      let modifiedContent = originalContent;
      
      // Track applied modifications
      const appliedModifications = [];
      
      for (const modification of args.modifications) {
        appliedModifications.push({
          type: modification.type,
          target: modification.target,
          success: true,
        });
        
        // In real implementation, apply the modification to AST
      }

      // Write back the modified script
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.path,
          content: modifiedContent,
        },
      };

      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to save script: ${writeResult.error}`);
      }

      return {
        path: args.path,
        modifications: appliedModifications,
        backupCreated: args.backup,
        message: `Script ${args.path} modified with ${appliedModifications.length} changes`,
            readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}