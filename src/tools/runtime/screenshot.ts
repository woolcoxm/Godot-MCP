import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const screenshotSchema = z.object({
  path: z.string().optional().describe('Optional file path to save the screenshot. If not provided, returns base64 data.'),
  format: z.enum(['png', 'jpg', 'webp']).optional().default('png').describe('Image format (png, jpg, webp)')
});

export function createScreenshotTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_take_screenshot',
    name: 'Take Screenshot',
    description: 'Take a screenshot of the current game view. Can save to file or return as base64 data.',
    category: 'runtime',
    inputSchema: screenshotSchema,
    handler: async (args: any) => {
      return handleScreenshot(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

export async function handleScreenshot(
  args: z.infer<typeof screenshotSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const result = await transport.execute({
      operation: 'take_screenshot',
      params: {
        path: args.path
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed to take screenshot: ${result.error}`
        }]
      };
    }

    const data = result.data;
    
    if (args.path && data.success) {
      // Screenshot saved to file
      return {
        content: [{
          type: 'text',
          text: `Screenshot saved to: ${data.path}\nSize: ${data.size?.x || 0}x${data.size?.y || 0}`
        }]
      };
    } else if (data.data) {
      // Base64 data returned
      const sizeInfo = data.size ? ` (${data.size.x}x${data.size.y})` : '';
      return {
        content: [{
          type: 'text',
          text: `Screenshot captured${sizeInfo}:\nFormat: ${data.format || 'png'}\nBase64 data: ${data.data.substring(0, 100)}...`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `Screenshot captured: ${JSON.stringify(data, null, 2)}`
        }]
      };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error taking screenshot: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}