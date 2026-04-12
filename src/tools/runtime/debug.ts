import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const debugInfoSchema = z.object({
  includeNodes: z.boolean().optional().default(false).describe('Include detailed node tree information'),
  includeResources: z.boolean().optional().default(false).describe('Include resource statistics')
});

export function createDebugInfoTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_get_debug_info',
    name: 'Get Debug Info',
    description: 'Get comprehensive debug information about the running game including performance, memory, scene tree, and resource usage.',
    category: 'runtime',
    inputSchema: debugInfoSchema,
    handler: async (args: any) => {
      return handleDebugInfo(args, transport);
    }
  };
}

export async function handleDebugInfo(
  args: z.infer<typeof debugInfoSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const result = await transport.execute({
      operation: 'get_debug_info',
      params: {
        includeNodes: args.includeNodes,
        includeResources: args.includeResources
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to get debug info: ${result.error}`
        }]
      };
    }

    const data = result.data;
    let output = '=== Godot Runtime Debug Information ===\n\n';

    // Performance stats
    if (data.performance) {
      output += '## Performance\n';
      output += `FPS: ${data.performance.fps || 'N/A'}\n`;
      output += `Physics FPS: ${data.performance.physics_fps || 'N/A'}\n`;
      output += `Process Time: ${data.performance.process_time || 'N/A'} ms\n`;
      output += `Physics Time: ${data.performance.physics_time || 'N/A'} ms\n`;
      output += `Draw Calls: ${data.performance.draw_calls || 'N/A'}\n`;
      output += `Vertices: ${data.performance.vertices || 'N/A'}\n`;
      output += `Objects Drawn: ${data.performance.objects_drawn || 'N/A'}\n\n`;
    }

    // Memory stats
    if (data.memory) {
      output += '## Memory\n';
      output += `Static Memory: ${formatBytes(data.memory.static || 0)}\n`;
      output += `Dynamic Memory: ${formatBytes(data.memory.dynamic || 0)}\n`;
      output += `Static Peak: ${formatBytes(data.memory.static_peak || 0)}\n`;
      output += `Orphan Nodes: ${data.memory.message_buffer || 'N/A'}\n\n`;
    }

    // Scene info
    if (data.scene) {
      output += '## Scene\n';
      output += `Current Scene: ${data.scene.current_scene || 'N/A'}\n`;
      output += `Total Nodes: ${data.scene.total_nodes || 0}\n`;
      
      if (args.includeNodes && data.scene.node_tree) {
        output += '\n### Node Tree (first 2 levels)\n';
        output += formatNodeTree(data.scene.node_tree, 0);
      }
      output += '\n';
    }

    // Resource stats
    if (args.includeResources && data.resources) {
      output += '## Resources\n';
      output += `Cached Resources: ${data.resources.resource_count || 0}\n\n`;
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
        text: `Error getting debug info: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function formatNodeTree(node: any, depth: number): string {
  const indent = '  '.repeat(depth);
  let output = `${indent}• ${node.name} (${node.class})`;
  
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      output += '\n' + formatNodeTree(child, depth + 1);
    }
  }
  
  return output;
}