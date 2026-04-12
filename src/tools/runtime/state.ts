import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const gameStateSchema = z.object({
  timeScale: z.number().optional().describe('Set the engine time scale (1.0 = normal speed)'),
  paused: z.boolean().optional().describe('Pause or unpause the game'),
  getState: z.boolean().optional().default(true).describe('Whether to return current state after modification')
});

export function createGameStateTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_set_game_state',
    name: 'Set Game State',
    description: 'Get or modify game runtime state including time scale and pause state.',
    category: 'runtime',
    inputSchema: gameStateSchema,
    handler: async (args: any) => {
      return handleGameState(args, transport);
    }
  };
}

export async function handleGameState(
  args: z.infer<typeof gameStateSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    let result;
    
    // If we're modifying state, call set_game_state
    if (args.timeScale !== undefined || args.paused !== undefined) {
      const setResult = await transport.execute({
        operation: 'set_game_state',
        params: {
          timeScale: args.timeScale,
          paused: args.paused
        }
      });

      if (!setResult.success) {
        return {
          content: [{
            type: 'text',
            text: `Failed to set game state: ${setResult.error}`
          }]
        };
      }
      
      result = setResult.data;
    } else if (args.getState) {
      // Just get current state
      const getResult = await transport.execute({
        operation: 'get_game_state',
        params: {}
      });

      if (!getResult.success) {
        return {
          content: [{
            type: 'text',
            text: `Failed to get game state: ${getResult.error}`
          }]
        };
      }
      
      result = getResult.data;
    } else {
      return {
        content: [{
          type: 'text',
          text: 'No operation specified. Provide timeScale or paused to modify state, or set getState: true to read current state.'
        }]
      };
    }

    let output = '=== Game State ===\n\n';
    
    if (result.time_scale !== undefined) {
      output += `Time Scale: ${result.time_scale}\n`;
    }
    
    if (result.paused !== undefined) {
      output += `Paused: ${result.paused ? 'Yes' : 'No'}\n`;
    }
    
    // Include additional state info if available
    if (result.scene_tree) {
      output += '\n## Scene Tree\n';
      output += `Current Scene: ${result.scene_tree.current_scene ? 'Yes' : 'No'}\n`;
      output += `Node Count: ${result.scene_tree.node_count || 0}\n`;
      output += `FPS: ${result.scene_tree.fps || 'N/A'}\n`;
    }
    
    if (result.performance) {
      output += '\n## Performance\n';
      Object.entries(result.performance).forEach(([key, value]) => {
        output += `${key}: ${value}\n`;
      });
    }
    
    if (result.time) {
      output += '\n## Time\n';
      Object.entries(result.time).forEach(([key, value]) => {
        output += `${key}: ${value}\n`;
      });
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error managing game state: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}