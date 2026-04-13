import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const spatialStreamSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  nodeType: z.enum(['AudioStreamPlayer3D', 'AudioStreamPlayer2D', 'AudioStreamGenerator', 'AudioStreamMicrophone']).describe('Type of audio node to create'),
  name: z.string().optional().describe('Name for the audio node'),
  streamPath: z.string().optional().describe('Path to audio stream resource (.ogg, .wav, etc.)'),
  // Common properties
  volumeDb: z.number().min(-80).max(24).default(0).describe('Volume in decibels'),
  pitchScale: z.number().min(0.01).max(4).default(1).describe('Pitch scale'),
  autoplay: z.boolean().default(false).describe('Whether to auto-play on ready'),
  // 3D spatial properties
  attenuationModel: z.enum(['Inverse', 'InverseSquare', 'Logarithmic', 'Disabled']).default('Inverse').describe('Attenuation model for 3D audio'),
  maxDistance: z.number().min(0).default(0).describe('Maximum distance for 3D audio (0 = no limit)'),
  unitSize: z.number().min(0).default(1).describe('Unit size for 3D audio (affects attenuation)'),
  // 2D spatial properties
  panningStrength: z.number().min(0).max(1).default(1).describe('Panning strength for 2D audio'),
  // Generator properties
  bufferLength: z.number().min(0.1).max(10).default(0.5).describe('Buffer length in seconds (for AudioStreamGenerator)'),
  mixRate: z.number().min(1000).max(192000).default(44100).describe('Mix rate in Hz (for AudioStreamGenerator)'),
  // Microphone properties
  deviceName: z.string().optional().describe('Specific microphone device name (empty for default)'),
  // Position for spatial nodes
  position: z.object({
    x: z.number().optional().describe('X position'),
    y: z.number().optional().describe('Y position'),
    z: z.number().optional().describe('Z position (for 3D)')
  }).optional().describe('Node position'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createSpatialStreamTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_spatial_stream',
    name: 'Create Spatial/Stream Audio',
    description: 'Create spatial audio nodes (3D/2D), audio stream generators, or microphone capture nodes.',
    category: 'audio',
    inputSchema: spatialStreamSchema,
    handler: async (args: any) => {
      return handleCreateSpatialStream(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleCreateSpatialStream(
  args: z.infer<typeof spatialStreamSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add common audio properties
    properties.volume_db = args.volumeDb;
    properties.pitch_scale = args.pitchScale;
    properties.autoplay = args.autoplay;
    
    // Add stream path if provided
    if (args.streamPath) {
      properties.stream = args.streamPath;
    }
    
    // Add spatial properties based on node type
    if (args.nodeType === 'AudioStreamPlayer3D') {
      // Map attenuation model to Godot property
      const attenuationMap = {
        'Inverse': 0,          // ATTENUATION_INVERSE_DISTANCE
        'InverseSquare': 1,    // ATTENUATION_INVERSE_SQUARE_DISTANCE
        'Logarithmic': 2,      // ATTENUATION_LOGARITHMIC
        'Disabled': 3          // ATTENUATION_DISABLED
      };
      properties.attenuation_model = attenuationMap[args.attenuationModel];
      properties.max_distance = args.maxDistance;
      properties.unit_size = args.unitSize;
    }
    
    if (args.nodeType === 'AudioStreamPlayer2D') {
      properties.panning_strength = args.panningStrength;
    }
    
    // Add generator properties
    if (args.nodeType === 'AudioStreamGenerator') {
      properties.buffer_length = args.bufferLength;
      properties.mix_rate = args.mixRate;
    }
    
    // Add microphone properties
    if (args.nodeType === 'AudioStreamMicrophone' && args.deviceName) {
      properties.device = args.deviceName;
    }
    
    // Add position if provided
    if (args.position) {
      properties.position = args.position;
    }

    const result = await transport.execute({
      operation: 'create_node',
      params: {
        parentPath: args.parentPath,
        nodeType: args.nodeType,
        name: args.name,
        properties
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create ${args.nodeType}: ${result.error}`
        }]
      };
    }

    let response = `Created ${args.nodeType}: ${args.name || 'Unnamed'}\nPath: ${result.data?.path || 'Unknown'}`;
    
    if (args.streamPath) {
      response += `\nStream: ${args.streamPath}`;
    }
    
    if (args.nodeType === 'AudioStreamGenerator') {
      response += `\nBuffer: ${args.bufferLength}s, Mix rate: ${args.mixRate}Hz`;
    }
    
    if (args.nodeType === 'AudioStreamPlayer3D') {
      response += `\nAttenuation: ${args.attenuationModel}, Max distance: ${args.maxDistance}`;
    }

    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating ${args.nodeType}: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}