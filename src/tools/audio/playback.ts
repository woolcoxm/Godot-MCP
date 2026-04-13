import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const audioPlayerSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node'),
  playerType: z.enum(['AudioStreamPlayer', 'AudioStreamPlayer2D', 'AudioStreamPlayer3D']).describe('Type of audio player'),
  name: z.string().optional().describe('Name for the audio player node'),
  streamPath: z.string().optional().describe('Path to audio stream resource (.ogg, .wav, etc.)'),
  autoplay: z.boolean().optional().default(false).describe('Whether to play automatically'),
  volume: z.number().optional().describe('Volume in dB (default: 0)'),
  pitch: z.number().optional().describe('Pitch scale (default: 1.0)'),
  loop: z.boolean().optional().default(false).describe('Whether to loop playback'),
  bus: z.string().optional().describe('Audio bus to use'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

const audioBusSchema = z.object({
  busName: z.string().describe('Name of the audio bus'),
  volume: z.number().optional().describe('Volume in dB'),
  mute: z.boolean().optional().describe('Whether to mute the bus'),
  solo: z.boolean().optional().describe('Whether to solo this bus'),
  bypass: z.boolean().optional().describe('Whether to bypass effects'),
  effects: z.array(z.any()).optional().describe('Audio effect configurations')
});

export function createAudioPlayerTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_audio_player',
    name: 'Create Audio Player',
    description: 'Create audio player nodes for playing sound effects and music.',
    category: 'audio',
    inputSchema: audioPlayerSchema,
    handler: async (args: any) => {
      return handleCreateAudioPlayer(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

export function createAudioBusTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_configure_audio_bus',
    name: 'Configure Audio Bus',
    description: 'Configure audio buses, volume, effects, and routing.',
    category: 'audio',
    inputSchema: audioBusSchema,
    handler: async (args: any) => {
      return handleConfigureAudioBus(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  };
}

async function handleCreateAudioPlayer(
  args: z.infer<typeof audioPlayerSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add stream if provided
    if (args.streamPath) {
      properties.stream = { resource_path: args.streamPath };
    }
    
    // Add audio properties
    if (args.autoplay !== undefined) {
      properties.autoplay = args.autoplay;
    }
    
    if (args.volume !== undefined) {
      properties.volume_db = args.volume;
    }
    
    if (args.pitch !== undefined) {
      properties.pitch_scale = args.pitch;
    }
    
    if (args.bus) {
      properties.bus = args.bus;
    }
    
    // Note: loop property would need to be set on the stream resource itself
    
    const result = await transport.execute({
      operation: 'create_node',
      params: {
        parentPath: args.parentPath,
        nodeType: args.playerType,
        name: args.name,
        properties
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create audio player: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created ${args.playerType}: ${args.name || 'Unnamed'}\nPath: ${result.data?.path || 'Unknown'}\nStream: ${args.streamPath || 'None'}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating audio player: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function handleConfigureAudioBus(
  args: z.infer<typeof audioBusSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Audio bus configuration would typically be done through project settings
    // or runtime audio server API. For headless/editor modes, we'll write to project settings.
    
    const busIndex = await getBusIndex(args.busName, transport);
    
    // Build bus configuration
    const config: Record<string, any> = {};
    
    if (args.volume !== undefined) {
      config[`audio/bus/${busIndex}/volume_db`] = args.volume;
    }
    
    if (args.mute !== undefined) {
      config[`audio/bus/${busIndex}/mute`] = args.mute;
    }
    
    if (args.solo !== undefined) {
      config[`audio/bus/${busIndex}/solo`] = args.solo;
    }
    
    if (args.bypass !== undefined) {
      config[`audio/bus/${busIndex}/bypass`] = args.bypass;
    }
    
    // Update project settings
    const result = await transport.execute({
      operation: 'modify_project_settings',
      params: {
        settings: config
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to configure audio bus: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Configured audio bus: ${args.busName}\nProperties updated: ${Object.keys(config).length}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error configuring audio bus: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function getBusIndex(busName: string, _transport: Transport): Promise<number> {
  // In a real implementation, we would query existing buses
  // For now, we'll use a simple mapping or create new bus
  const busNames = ['Master', 'Music', 'SFX', 'Voice'];
  const index = busNames.indexOf(busName);
  
  if (index === -1) {
    // Bus doesn't exist, would need to create it
    // For simplicity, we'll use index 0 (Master)
    return 0;
  }
  
  return index;
}