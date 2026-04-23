import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { ScriptGenerator } from '../../utils/script-generator.js';

const createScriptSchema = z.object({
  path: z.string().describe('Path where the script should be created (e.g., "res://scripts/player.gd")'),
  className: z.string().optional().describe('Optional class_name for the script'),
  extendsClass: z.string().default('Node').describe('Class to extend (e.g., "Node", "Node2D", "CharacterBody3D")'),
  signals: z.array(z.object({
    name: z.string(),
    arguments: z.array(z.object({
      name: z.string(),
      type: z.string(),
    })).optional(),
  })).optional().describe('Signals to define in the script'),
  variables: z.array(z.object({
    name: z.string(),
    type: z.string(),
    default_value: z.any().optional(),
    export: z.boolean().default(false),
    onready: z.boolean().default(false),
    static: z.boolean().default(false),
  })).optional().describe('Variables to define in the script'),
  functions: z.array(z.object({
    name: z.string(),
    return_type: z.string().default('void'),
    arguments: z.array(z.object({
      name: z.string(),
      type: z.string(),
    })).optional(),
    body: z.string().optional(),
    static: z.boolean().default(false),
    virtual: z.boolean().default(false),
  })).optional().describe('Functions to define in the script'),
  constants: z.array(z.object({
    name: z.string(),
    value: z.any(),
  })).optional().describe('Constants to define in the script'),
  enums: z.array(z.object({
    name: z.string(),
    values: z.record(z.string(), z.number()),
  })).optional().describe('Enums to define in the script'),
});

export function createCreateScriptTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_script',
    name: 'Create GDScript',
    description: 'Create a new GDScript file with class definition, signals, variables, and functions',
    category: 'script',
    inputSchema: createScriptSchema,
    handler: async (args) => {
      // Generate GDScript content
      const scriptInfo = {
        path: args.path,
        class_name: args.className,
        extends_class: args.extendsClass,
        signals: args.signals || [],
        variables: args.variables || [],
        functions: args.functions || [],
        constants: args.constants || [],
        enums: args.enums || [],
      };

      const content = ScriptGenerator.generateScript(scriptInfo);
      
      // Write the script file
      const operation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.path,
          content: content,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create script');
      }

      return {
        content: [
          {
            type: 'text',
            text: `Created script at ${args.path}`
          }
        ]
      };
    },
    destructiveHint: false,
    idempotentHint: false,
  };
}