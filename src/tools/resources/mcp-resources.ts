import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const scriptResourceSchema = z.object({
  scriptPath: z.string().describe('Path to the GDScript file'),
  includeSource: z.boolean().optional().default(true).describe('Include script source code'),
  includeMetadata: z.boolean().optional().default(true).describe('Include script metadata (signals, exports)'),
  format: z.enum(['json', 'markdown', 'plain']).optional().default('json').describe('Output format')
});

const sceneResourceSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  includeNodes: z.boolean().optional().default(true).describe('Include node hierarchy'),
  includeResources: z.boolean().optional().default(true).describe('Include referenced resources'),
  maxDepth: z.number().optional().default(3).describe('Maximum depth for node tree'),
  format: z.enum(['json', 'markdown', 'plain']).optional().default('json').describe('Output format')
});

const projectResourceSchema = z.object({
  includeSettings: z.boolean().optional().default(true).describe('Include project settings'),
  includeResources: z.boolean().optional().default(false).describe('Include resource list'),
  includeScenes: z.boolean().optional().default(false).describe('Include scene list'),
  format: z.enum(['json', 'markdown', 'plain']).optional().default('json').describe('Output format')
});

export function createScriptResourceTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_script_resource',
    name: 'Script Resource',
    description: 'Get GDScript resources as MCP-readable content with source code and metadata.',
    category: 'resources',
    inputSchema: scriptResourceSchema,
    handler: async (args: any) => {
      return handleScriptResource(args, transport);
    },
    readOnlyHint: true,
    destructiveHint: false,
idempotentHint: true
  };
}

export function createSceneResourceTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_scene_resource',
    name: 'Scene Resource',
    description: 'Get scene resources as MCP-readable content with node hierarchy and properties.',
    category: 'resources',
    inputSchema: sceneResourceSchema,
    handler: async (args: any) => {
      return handleSceneResource(args, transport);
    }
  };
}

export function createProjectResourceTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_project_resource',
    name: 'Project Resource',
    description: 'Get project overview as MCP-readable content with settings and structure.',
    category: 'resources',
    inputSchema: projectResourceSchema,
    handler: async (args: any) => {
      return handleProjectResource(args, transport);
    }
  };
}

async function handleScriptResource(
  args: z.infer<typeof scriptResourceSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Read the script file
    const readResult = await transport.execute({
      operation: 'read_script',
      params: {
        path: args.scriptPath
      }
    });

    if (!readResult.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to read script: ${readResult.error}`
        }]
      };
    }

    const scriptData = readResult.data;
    let output = '';
    
    // Format based on requested format
    switch (args.format) {
      case 'json':
        output = JSON.stringify(scriptData, null, 2);
        break;
        
      case 'markdown':
        output = formatScriptAsMarkdown(scriptData, args);
        break;
        
      case 'plain':
        output = formatScriptAsPlain(scriptData, args);
        break;
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
        text: `Error getting script resource: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function handleSceneResource(
  args: z.infer<typeof sceneResourceSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Read the scene file
    const readResult = await transport.execute({
      operation: 'read_scene',
      params: {
        path: args.scenePath
      }
    });

    if (!readResult.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to read scene: ${readResult.error}`
        }]
      };
    }

    const sceneData = readResult.data;
    let output = '';
    
    // Format based on requested format
    switch (args.format) {
      case 'json':
        output = JSON.stringify(sceneData, null, 2);
        break;
        
      case 'markdown':
        output = formatSceneAsMarkdown(sceneData, args);
        break;
        
      case 'plain':
        output = formatSceneAsPlain(sceneData, args);
        break;
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
        text: `Error getting scene resource: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function handleProjectResource(
  args: z.infer<typeof projectResourceSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const projectData: Record<string, any> = {
      timestamp: new Date().toISOString()
    };
    
    // Get project settings if requested
    if (args.includeSettings) {
      const settingsResult = await transport.execute({
        operation: 'read_project_settings',
        params: {}
      });
      
      if (settingsResult.success) {
        projectData.settings = settingsResult.data;
      }
    }
    
    // Get resource list if requested
    if (args.includeResources) {
      // This would require scanning the project directory
      // For now, we'll return a placeholder
      projectData.resources = {
        note: 'Resource scanning not yet implemented'
      };
    }
    
    // Get scene list if requested
    if (args.includeScenes) {
      // This would require scanning for .tscn files
      // For now, we'll return a placeholder
      projectData.scenes = {
        note: 'Scene scanning not yet implemented'
      };
    }
    
    let output = '';
    
    // Format based on requested format
    switch (args.format) {
      case 'json':
        output = JSON.stringify(projectData, null, 2);
        break;
        
      case 'markdown':
        output = formatProjectAsMarkdown(projectData, args);
        break;
        
      case 'plain':
        output = formatProjectAsPlain(projectData, args);
        break;
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
        text: `Error getting project resource: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

// Formatting helpers
function formatScriptAsMarkdown(scriptData: any, args: any): string {
  let md = `# GDScript: ${scriptData.path || 'Unknown'}\n\n`;
  
  if (args.includeSource && scriptData.content) {
    md += '## Source Code\n\n```gdscript\n';
    md += scriptData.content;
    md += '\n```\n\n';
  }
  
  if (args.includeMetadata) {
    if (scriptData.signals && scriptData.signals.length > 0) {
      md += '## Signals\n\n';
      for (const signal of scriptData.signals) {
        md += `- \`${signal.name}\``;
        if (signal.args && signal.args.length > 0) {
          md += `(${signal.args.join(', ')})`;
        }
        md += '\n';
      }
      md += '\n';
    }
    
    if (scriptData.exports && scriptData.exports.length > 0) {
      md += '## Exported Properties\n\n';
      for (const exportProp of scriptData.exports) {
        md += `- \`${exportProp.name}: ${exportProp.type}\``;
        if (exportProp.default !== undefined) {
          md += ` = ${exportProp.default}`;
        }
        md += '\n';
      }
      md += '\n';
    }
  }
  
  return md;
}

function formatScriptAsPlain(scriptData: any, args: any): string {
  let text = `Script: ${scriptData.path || 'Unknown'}\n`;
  text += '='.repeat(50) + '\n\n';
  
  if (args.includeSource && scriptData.content) {
    text += 'SOURCE CODE:\n';
    text += scriptData.content;
    text += '\n\n';
  }
  
  if (args.includeMetadata) {
    if (scriptData.signals && scriptData.signals.length > 0) {
      text += 'SIGNALS:\n';
      for (const signal of scriptData.signals) {
        text += `  - ${signal.name}`;
        if (signal.args && signal.args.length > 0) {
          text += `(${signal.args.join(', ')})`;
        }
        text += '\n';
      }
      text += '\n';
    }
  }
  
  return text;
}

function formatSceneAsMarkdown(sceneData: any, args: any): string {
  let md = `# Scene: ${sceneData.path || 'Unknown'}\n\n`;
  
  if (args.includeNodes && sceneData.nodes) {
    md += '## Node Hierarchy\n\n';
    md += formatNodeTree(sceneData.nodes, 0, args.maxDepth);
    md += '\n';
  }
  
  if (args.includeResources && sceneData.resources) {
    md += '## Resources\n\n';
    for (const [id, resource] of Object.entries(sceneData.resources)) {
      md += `- ${id}: ${resource}\n`;
    }
    md += '\n';
  }
  
  return md;
}

function formatSceneAsPlain(sceneData: any, args: any): string {
  let text = `Scene: ${sceneData.path || 'Unknown'}\n`;
  text += '='.repeat(50) + '\n\n';
  
  if (args.includeNodes && sceneData.nodes) {
    text += 'NODES:\n';
    text += formatNodeTreePlain(sceneData.nodes, 0, args.maxDepth);
    text += '\n';
  }
  
  return text;
}

function formatProjectAsMarkdown(projectData: any, args: any): string {
  let md = '# Godot Project\n\n';
  md += `Generated: ${projectData.timestamp}\n\n`;
  
  if (args.includeSettings && projectData.settings) {
    md += '## Project Settings\n\n';
    // Show some key settings
    const keySettings = ['application/config/name', 'display/window/size/width', 'display/window/size/height'];
    for (const key of keySettings) {
      if (projectData.settings[key] !== undefined) {
        md += `- \`${key}\`: ${projectData.settings[key]}\n`;
      }
    }
    md += '\n';
  }
  
  return md;
}

function formatProjectAsPlain(projectData: any, args: any): string {
  let text = 'GODOT PROJECT\n';
  text += '='.repeat(50) + '\n\n';
  text += `Generated: ${projectData.timestamp}\n\n`;
  
  if (args.includeSettings && projectData.settings) {
    text += 'SETTINGS:\n';
    const keySettings = ['application/config/name', 'display/window/size/width', 'display/window/size/height'];
    for (const key of keySettings) {
      if (projectData.settings[key] !== undefined) {
        text += `  ${key}: ${projectData.settings[key]}\n`;
      }
    }
    text += '\n';
  }
  
  return text;
}

function formatNodeTree(nodes: any[], depth: number, maxDepth: number): string {
  if (depth > maxDepth) return '';
  
  let md = '';
  for (const node of nodes) {
    const indent = '  '.repeat(depth);
    md += `${indent}- \`${node.name}\` (${node.type})`;
    
    if (node.properties && Object.keys(node.properties).length > 0) {
      const propCount = Object.keys(node.properties).length;
      md += ` [${propCount} properties]`;
    }
    
    md += '\n';
    
    if (node.children && node.children.length > 0) {
      md += formatNodeTree(node.children, depth + 1, maxDepth);
    }
  }
  
  return md;
}

function formatNodeTreePlain(nodes: any[], depth: number, maxDepth: number): string {
  if (depth > maxDepth) return '';
  
  let text = '';
  for (const node of nodes) {
    const indent = '  '.repeat(depth);
    text += `${indent}+ ${node.name} (${node.type})\n`;
    
    if (node.children && node.children.length > 0) {
      text += formatNodeTreePlain(node.children, depth + 1, maxDepth);
    }
  }
  
  return text;
}