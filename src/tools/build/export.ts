import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';
import { isPathSafe } from '../../utils/security.js';

const exportPresetSchema = z.object({
  presetName: z.string().describe('Name for the export preset'),
  platform: z.enum(['Windows Desktop', 'Linux/X11', 'macOS', 'Android', 'iOS', 'Web']).describe('Target platform'),
  exportPath: z.string().describe('Output path for exported project'),
  features: z.array(z.string()).optional().describe('Platform-specific features'),
  options: z.record(z.string(), z.any()).optional().describe('Export options'),
  customResources: z.array(z.string()).optional().describe('Custom resources to include')
});

const buildProjectSchema = z.object({
  presetName: z.string().optional().describe('Export preset to use (if not specified, uses default)'),
  exportPath: z.string().optional().describe('Custom export path (overrides preset)'),
  cleanBuild: z.boolean().optional().default(false).describe('Clean build directory before exporting'),
  debug: z.boolean().optional().default(false).describe('Build debug version'),
  threads: z.number().optional().describe('Number of threads to use for building')
});

export function createExportPresetTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_export_preset',
    name: 'Create Export Preset',
    description: 'Create export presets for different platforms (Windows, Linux, Android, etc.).',
    category: 'build',
    inputSchema: exportPresetSchema,
    handler: async (args: any) => {
      return handleCreateExportPreset(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

export function createBuildProjectTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_build_project',
    name: 'Build Project',
    description: 'Build/export the Godot project using export presets.',
    category: 'build',
    inputSchema: buildProjectSchema,
    handler: async (args: any) => {
      return handleBuildProject(args, transport);
    }
  };
}

async function handleCreateExportPreset(
  args: z.infer<typeof exportPresetSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Map platform names to Godot export platform identifiers
    const platformMap: Record<string, string> = {
      'Windows Desktop': 'Windows Desktop',
      'Linux/X11': 'Linux/X11',
      'macOS': 'macOS',
      'Android': 'Android',
      'iOS': 'iOS',
      'Web': 'Web'
    };
    
    const platformId = platformMap[args.platform] || args.platform;
    
    // Build export preset configuration
    const presetConfig: Record<string, any> = {
      name: args.presetName,
      platform: platformId,
      export_path: args.exportPath,
      options: args.options || {},
      features: args.features || [],
      custom_resources: args.customResources || []
    };
    
    // In a real implementation, we would write to export_presets.cfg
    // For now, we'll create a JSON representation
    const result = await transport.execute({
      operation: 'write_file',
      params: {
        path: `res://export_presets/${args.presetName.replace(/\s+/g, '_')}.json`,
        content: JSON.stringify(presetConfig, null, 2)
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create export preset: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created export preset: ${args.presetName}\nPlatform: ${args.platform}\nExport path: ${args.exportPath}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating export preset: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function handleBuildProject(
  args: z.infer<typeof buildProjectSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validate security limits
    if (args.presetName && !isPathSafe(args.presetName)) {
      throw new Error(`Invalid preset name: ${args.presetName}`);
    }
    if (args.exportPath && !isPathSafe(args.exportPath)) {
      throw new Error(`Invalid export path: ${args.exportPath}`);
    }

    // Build command for headless export
    // Note: This would require Godot to be installed and in PATH
    let buildCommand = 'godot --headless --export';
    
    if (args.presetName) {
      buildCommand += ` "${args.presetName}"`;
    } else {
      buildCommand += '-release';
    }
    
    if (args.exportPath) {
      buildCommand += ` "${args.exportPath}"`;
    }
    
    if (args.debug) {
      buildCommand += ' --debug';
    }
    
    // For headless mode, we can execute the build command
    // For editor mode, we would use editor API
    
    const result = await transport.execute({
      operation: 'execute_command',
      params: {
        command: buildCommand,
        timeout: 300000 // 5 minutes timeout for build
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Build failed: ${result.error}`
        }]
      };
    }

    // Parse build output
    let output = 'Build completed';
    if (result.data && result.data.output) {
      const lines = result.data.output.split('\n');
      const lastLines = lines.slice(-10).join('\n'); // Show last 10 lines
      output = `Build output:\n${lastLines}`;
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
        text: `Error building project: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}