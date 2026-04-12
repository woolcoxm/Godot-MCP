import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const importAssetSchema = z.object({
  sourcePath: z.string().describe('Local path to the asset file'),
  targetPath: z.string().describe('Target path in Godot project (e.g., "res://assets/textures/")'),
  assetType: z.enum(['texture', 'audio', 'model', 'font', 'other']).default('other').describe('Type of asset'),
  importSettings: z.record(z.string(), z.any()).optional().describe('Import settings for the asset'),
});

export function createImportAssetTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_import_asset',
    name: 'Import Asset',
    description: 'Copy assets into project and configure .import settings',
    category: 'assets',
    inputSchema: importAssetSchema,
    handler: async (args) => {
      // In a real implementation, we would:
      // 1. Read the source file
      // 2. Copy it to target path in project
      // 3. Generate .import file with settings
      // For now, simulate the operation
      
      // Simulate file copy operation
      const copyOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.targetPath,
          content: `[simulated asset file - would contain binary data]`,
        },
      };

      const copyResult = await transport.execute(copyOperation);
      
      if (!copyResult.success) {
        throw new Error(`Failed to copy asset: ${copyResult.error}`);
      }

      // Create .import file if import settings provided
      if (args.importSettings && Object.keys(args.importSettings).length > 0) {
        const importFilePath = args.targetPath + '.import';
        const importContent = generateImportFile(args.importSettings, args.assetType);
        
        const importOperation: TransportOperation = {
          operation: 'write_file',
          params: {
            path: importFilePath,
            content: importContent,
          },
        };

        const importResult = await transport.execute(importOperation);
        
        if (!importResult.success) {
          throw new Error(`Failed to create .import file: ${importResult.error}`);
        }
      }

      return {
        sourcePath: args.sourcePath,
        targetPath: args.targetPath,
        assetType: args.assetType,
        importSettings: args.importSettings || {},
        message: `Asset imported to ${args.targetPath}`,
      };
    },
    destructiveHint: false,
    idempotentHint: false,
  };
}

function generateImportFile(settings: Record<string, any>, assetType: string): string {
  const lines = ['[remap]'];
  lines.push('importer="' + getImporterForType(assetType) + '"');
  lines.push('');
  
  lines.push('[deps]');
  lines.push('source_file="' + settings.source_file || '""');
  lines.push('');
  
  lines.push('[params]');
  for (const [key, value] of Object.entries(settings)) {
    if (key !== 'source_file') {
      lines.push(`${key}=${JSON.stringify(value)}`);
    }
  }
  
  return lines.join('\n');
}

function getImporterForType(assetType: string): string {
  switch (assetType) {
    case 'texture': return 'texture_2d';
    case 'audio': return 'audio_stream_wav';
    case 'model': return 'scene';
    case 'font': return 'dynamic_font';
    default: return 'resource';
  }
}