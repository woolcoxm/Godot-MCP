import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const createProjectSchema = z.object({
  path: z.string().describe('Path where the project should be created'),
  name: z.string().default('New Godot Project').describe('Name of the project'),
  template: z.enum(['empty', '3d', '2d']).default('empty').describe('Project template'),
});

export function createCreateProjectTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_project',
    name: 'Create Godot Project',
    description: 'Create a new Godot project with specified settings',
    category: 'project',
    inputSchema: createProjectSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'create_project',
        params: {
          path: args.path,
          name: args.name,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      return {
        ...result.data,
        message: `Created project ${args.name} at ${args.path}`
      };
    },
    destructiveHint: false,
    idempotentHint: false,
        readOnlyHint: false,
  };
}