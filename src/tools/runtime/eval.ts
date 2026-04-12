import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const evalSchema = z.object({
  code: z.string().describe('GDScript code to evaluate'),
  method: z.string().optional().describe('Optional method name to call on the script instance'),
  args: z.array(z.any()).optional().describe('Arguments to pass to the method'),
  captureOutput: z.boolean().optional().default(false).describe('Whether to capture output (not yet implemented)')
});

export function createEvalTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_eval_gdscript',
    name: 'Evaluate GDScript',
    description: 'Evaluate GDScript code at runtime. Can execute arbitrary GDScript and optionally call methods on the resulting instance.',
    category: 'runtime',
    inputSchema: evalSchema,
    handler: async (args: any) => {
      return handleEval(args, transport);
    }
  };
}

export async function handleEval(
  args: z.infer<typeof evalSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const result = await transport.execute({
      operation: 'eval_gdscript',
      params: {
        code: args.code,
        method: args.method,
        args: args.args,
        captureOutput: args.captureOutput
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to evaluate GDScript: ${result.error}`
        }]
      };
    }

    // Format the result for display
    const formattedResult = formatResult(result.data);
    
    return {
      content: [{
        type: 'text',
        text: formattedResult
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error evaluating GDScript: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

function formatResult(result: any): string {
  if (result === null || result === undefined) {
    return 'null';
  }
  
  if (typeof result === 'string') {
    return `"${result}"`;
  }
  
  if (typeof result === 'number' || typeof result === 'boolean') {
    return String(result);
  }
  
  if (Array.isArray(result)) {
    const items = result.map(item => formatResult(item)).join(', ');
    return `[${items}]`;
  }
  
  if (typeof result === 'object') {
    // Check if it's an error object
    if (result.error) {
      return `Error: ${result.error}`;
    }
    
    // Check if it's a result object
    if (result.result !== undefined) {
      return `Result: ${formatResult(result.result)}`;
    }
    
    // Try to format as JSON
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }
  
  return String(result);
}