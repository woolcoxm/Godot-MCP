import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const httpRequestSchema = z.object({
  url: z.string().describe('URL to request'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).default('GET').describe('HTTP method'),
  headers: z.record(z.string(), z.string()).optional().describe('HTTP headers'),
  body: z.string().optional().describe('Request body (for POST, PUT, PATCH)'),
  timeout: z.number().optional().describe('Request timeout in seconds'),
  followRedirects: z.boolean().optional().default(true).describe('Whether to follow redirects'),
  validateSsl: z.boolean().optional().default(true).describe('Whether to validate SSL certificates')
});

const websocketSchema = z.object({
  url: z.string().describe('WebSocket URL (ws:// or wss://)'),
  protocols: z.array(z.string()).optional().describe('WebSocket sub-protocols'),
  handshakeHeaders: z.record(z.string(), z.string()).optional().describe('Handshake headers'),
  nodePath: z.string().optional().describe('Path to WebSocketClient node (if attaching to existing)'),
  createNode: z.boolean().optional().default(true).describe('Whether to create a new WebSocketClient node')
});

export function createHttpRequestTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_http_request',
    name: 'HTTP Request',
    description: 'Make HTTP requests from Godot (GET, POST, etc.).',
    category: 'networking',
    inputSchema: httpRequestSchema,
    handler: async (args: any) => {
      return handleHttpRequest(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

export function createWebSocketTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_websocket',
    name: 'WebSocket Connection',
    description: 'Create WebSocket connections for real-time communication.',
    category: 'networking',
    inputSchema: websocketSchema,
    handler: async (args: any) => {
      return handleWebSocket(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  };
}

async function handleHttpRequest(
  args: z.infer<typeof httpRequestSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // For headless mode, we can use GDScript to make HTTP requests
    // For editor/runtime, we can use existing nodes or create new ones
    
    const gdscript = `
extends HTTPRequest

func _ready():
    var headers = ${JSON.stringify(args.headers || {})}
    var use_ssl = ${args.url.startsWith('https://') ? 'true' : 'false'}
    var validate_ssl = ${args.validateSsl ? 'true' : 'false'}
    
    var error = request("${args.url}", headers, ${getHttpMethodConstant(args.method)}, "${args.body || ''}")
    if error != OK:
        print("HTTP request failed: ", error)
        get_tree().quit(1)

func _on_request_completed(result, response_code, headers, body):
    var response = {
        "result": result,
        "response_code": response_code,
        "headers": headers,
        "body": body.get_string_from_utf8() if body else ""
    }
    print(JSON.stringify(response))
    get_tree().quit(0 if result == RESULT_SUCCESS else 1)
`;
    
    // Create a temporary script and execute it
    const result = await transport.execute({
      operation: 'eval_gdscript',
      params: {
        code: gdscript,
        captureOutput: true
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `HTTP request failed: ${result.error}`
        }]
      };
    }

    // Parse the response
    let responseText = 'HTTP Request Completed';
    if (result.data && result.data.result) {
      const response = result.data.result;
      if (typeof response === 'string') {
        try {
          const parsed = JSON.parse(response);
          responseText = `HTTP ${args.method} ${args.url}\nStatus: ${parsed.response_code || 'Unknown'}\nBody length: ${parsed.body?.length || 0} bytes`;
        } catch {
          responseText = `HTTP ${args.method} ${args.url}\nResponse: ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`;
        }
      }
    }

    return {
      content: [{
        type: 'text',
        text: responseText
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error making HTTP request: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function handleWebSocket(
  args: z.infer<typeof websocketSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    if (args.createNode) {
      // Create a WebSocketClient node
      const properties: Record<string, any> = {};
      
      if (args.protocols && args.protocols.length > 0) {
        properties.supported_protocols = args.protocols;
      }
      
      if (args.handshakeHeaders) {
        properties.handshake_headers = args.handshakeHeaders;
      }
      
      const result = await transport.execute({
        operation: 'create_node',
        params: {
          parentPath: '.',
          nodeType: 'WebSocketClient',
          name: 'WebSocketClient',
          properties
        }
      });

      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `Failed to create WebSocket client: ${result.error}`
          }]
        };
      }

      // Connect to URL
      const connectScript = `
extends WebSocketClient

func _ready():
    var error = connect_to_url("${args.url}")
    if error != OK:
        print("WebSocket connection failed: ", error)
        get_tree().quit(1)

func _connected(protocol):
    print("WebSocket connected with protocol: ", protocol)
    var status = {
        "connected": true,
        "protocol": protocol,
        "url": "${args.url}"
    }
    print(JSON.stringify(status))
    get_tree().quit(0)

func _connection_closed(was_clean):
    print("WebSocket closed (clean: ", was_clean, ")")
    get_tree().quit(was_clean ? 0 : 1)

func _connection_error():
    print("WebSocket connection error")
    get_tree().quit(1)
`;
      
      const connectResult = await transport.execute({
        operation: 'eval_gdscript',
        params: {
          code: connectScript,
          captureOutput: true
        }
      });

      if (!connectResult.success) {
        return {
          content: [{
            type: 'text',
            text: `WebSocket connection failed: ${connectResult.error}`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `WebSocket client created and connected to: ${args.url}\nNode path: ${result.data?.path || 'Unknown'}`
        }]
      };
    } else if (args.nodePath) {
      // Use existing node
      return {
        content: [{
          type: 'text',
          text: `Using existing WebSocket node at: ${args.nodePath}\nURL: ${args.url}`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: 'Either createNode must be true or nodePath must be provided'
        }]
      };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

function getHttpMethodConstant(method: string): string {
  const methods: Record<string, string> = {
    'GET': 'HTTPClient.METHOD_GET',
    'POST': 'HTTPClient.METHOD_POST',
    'PUT': 'HTTPClient.METHOD_PUT',
    'DELETE': 'HTTPClient.METHOD_DELETE',
    'PATCH': 'HTTPClient.METHOD_PATCH',
    'HEAD': 'HTTPClient.METHOD_HEAD'
  };
  return methods[method] || 'HTTPClient.METHOD_GET';
}