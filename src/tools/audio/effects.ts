import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const audioEffectSchema = z.object({
  busIndex: z.number().min(0).describe('Audio bus index to add effect to'),
  effectType: z.enum([
    'Reverb', 'EQ', 'Compressor', 'Limiter', 'BandPassFilter',
    'HighPassFilter', 'LowPassFilter', 'NotchFilter', 'Panner',
    'Chorus', 'Delay', 'Distortion', 'Phaser', 'PitchShift'
  ]).describe('Type of audio effect to create'),
  name: z.string().optional().describe('Name for the effect'),
  position: z.number().min(0).default(0).describe('Position in the effect chain (0 = first)'),
  bypass: z.boolean().default(false).describe('Whether effect is initially bypassed'),
  // Reverb parameters
  roomSize: z.number().min(0).max(1).default(0.8).describe('Room size (0-1, for Reverb)'),
  damping: z.number().min(0).max(1).default(0.5).describe('Damping (0-1, for Reverb)'),
  wet: z.number().min(0).max(1).default(0.5).describe('Wet mix (0-1)'),
  dry: z.number().min(0).max(1).default(1).describe('Dry mix (0-1)'),
  // EQ parameters
  gain1: z.number().min(-80).max(24).default(0).describe('Gain for band 1 (dB, for EQ)'),
  gain2: z.number().min(-80).max(24).default(0).describe('Gain for band 2 (dB, for EQ)'),
  gain3: z.number().min(-80).max(24).default(0).describe('Gain for band 3 (dB, for EQ)'),
  // Compressor/Limiter parameters
  threshold: z.number().min(-60).max(0).default(-20).describe('Threshold (dB, for Compressor/Limiter)'),
  ratio: z.number().min(1).max(20).default(4).describe('Compression ratio (for Compressor)'),
  attack: z.number().min(0.001).max(2).default(0.02).describe('Attack time (seconds)'),
  release: z.number().min(0.001).max(2).default(0.25).describe('Release time (seconds)'),
  // Filter parameters
  cutoffHz: z.number().min(1).max(20000).default(1000).describe('Cutoff frequency (Hz, for filters)'),
  resonance: z.number().min(0.1).max(4).default(1).describe('Resonance (for filters)'),
  // Delay parameters
  feedback: z.number().min(0).max(0.99).default(0.5).describe('Feedback amount (0-0.99, for Delay)'),
  delayMs: z.number().min(1).max(2000).default(250).describe('Delay time (milliseconds)'),
  // Distortion parameters
  drive: z.number().min(0).max(1).default(0.5).describe('Drive amount (0-1, for Distortion)'),
  // Chorus/Phaser parameters
  rateHz: z.number().min(0.1).max(10).default(1).describe('Modulation rate (Hz)'),
  depth: z.number().min(0).max(1).default(0.5).describe('Modulation depth (0-1)'),
  // PitchShift parameters
  pitchScale: z.number().min(0.5).max(2).default(1).describe('Pitch scale (0.5-2.0)'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createAudioEffectTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_audio_effect',
    name: 'Create Audio Effect',
    description: 'Create and configure audio effects (reverb, EQ, compressor, filters, etc.) for audio buses.',
    category: 'audio',
    inputSchema: audioEffectSchema,
    handler: async (args: any) => {
      return handleCreateAudioEffect(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  };
}

async function handleCreateAudioEffect(
  args: z.infer<typeof audioEffectSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add common properties
    properties.bypass = args.bypass;
    
    // Add effect-specific properties based on type
    switch (args.effectType) {
      case 'Reverb':
        properties.room_size = args.roomSize;
        properties.damping = args.damping;
        properties.wet = args.wet;
        properties.dry = args.dry;
        break;
        
      case 'EQ':
        properties.gain1 = args.gain1;
        properties.gain2 = args.gain2;
        properties.gain3 = args.gain3;
        break;
        
      case 'Compressor':
      case 'Limiter':
        properties.threshold = args.threshold;
        properties.ratio = args.ratio;
        properties.attack = args.attack;
        properties.release = args.release;
        break;
        
      case 'BandPassFilter':
      case 'HighPassFilter':
      case 'LowPassFilter':
      case 'NotchFilter':
        properties.cutoff_hz = args.cutoffHz;
        properties.resonance = args.resonance;
        break;
        
      case 'Delay':
        properties.feedback = args.feedback;
        properties.delay_ms = args.delayMs;
        break;
        
      case 'Distortion':
        properties.drive = args.drive;
        break;
        
      case 'Chorus':
      case 'Phaser':
        properties.rate_hz = args.rateHz;
        properties.depth = args.depth;
        break;
        
      case 'PitchShift':
        properties.pitch_scale = args.pitchScale;
        break;
    }

    const result = await transport.execute({
      operation: 'add_audio_effect',
      params: {
        busIndex: args.busIndex,
        effectType: args.effectType,
        name: args.name,
        position: args.position,
        properties
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to create audio effect: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Created ${args.effectType} effect on bus ${args.busIndex}: ${args.name || 'Unnamed'}\nPosition: ${args.position}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating audio effect: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}