import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const inputEventSchema = z.object({
  type: z.enum(['key', 'mouse_button', 'mouse_motion', 'joypad_button', 'joypad_motion']).describe('Type of input event'),
  // Key events
  keycode: z.number().optional().describe('Key code (for key events)'),
  physical_keycode: z.number().optional().describe('Physical key code (for key events)'),
  pressed: z.boolean().optional().describe('Whether the key/button is pressed'),
  echo: z.boolean().optional().describe('Whether this is a key repeat event'),
  // Mouse events
  mouse_button_index: z.number().optional().describe('Mouse button index (for mouse_button events)'),
  x: z.number().optional().describe('X coordinate (for mouse events)'),
  y: z.number().optional().describe('Y coordinate (for mouse events)'),
  dx: z.number().optional().describe('X delta (for mouse_motion events)'),
  dy: z.number().optional().describe('Y delta (for mouse_motion events)'),
  // Joypad events
  joypad_button_index: z.number().optional().describe('Button index (for joypad_button events)'),
  pressure: z.number().optional().describe('Pressure value (for joypad_button events)'),
  axis: z.number().optional().describe('Axis index (for joypad_motion events)'),
  axis_value: z.number().optional().describe('Axis value (for joypad_motion events)')
});

const simulateInputSchema = z.object({
  events: z.array(inputEventSchema).describe('Array of input events to simulate')
});

export function createSimulateInputTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_simulate_input',
    name: 'Simulate Input',
    description: 'Simulate input events at runtime (keyboard, mouse, joypad). Useful for automated testing or remote control.',
    category: 'runtime',
    inputSchema: simulateInputSchema,
    handler: async (args: any) => {
      return handleSimulateInput(args, transport);
    }
  };
}

export async function handleSimulateInput(
  args: z.infer<typeof simulateInputSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const result = await transport.execute({
      operation: 'simulate_input',
      params: {
        events: args.events
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to simulate input: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Successfully simulated ${result.data?.events_processed || 0} input events`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error simulating input: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}