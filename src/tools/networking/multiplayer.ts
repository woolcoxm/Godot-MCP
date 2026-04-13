import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const multiplayerSchema = z.object({
  parentPath: z.string().default('.').describe('Path to parent node (default: current scene root)'),
  nodeType: z.enum(['MultiplayerSpawner', 'MultiplayerSynchronizer', 'SceneMultiplayer', 'ENetMultiplayerPeer', 'WebSocketMultiplayerPeer']).describe('Type of multiplayer node to create'),
  name: z.string().optional().describe('Name for the multiplayer node'),
  // MultiplayerSpawner properties
  spawnPath: z.string().optional().describe('Path to scene to spawn (for MultiplayerSpawner)'),
  spawnLimit: z.number().min(0).default(0).describe('Maximum number of spawns (0 = unlimited)'),
  autoSpawn: z.boolean().default(true).describe('Automatically spawn for new peers'),
  // MultiplayerSynchronizer properties
  rootPath: z.string().optional().describe('Path to root node to synchronize (for MultiplayerSynchronizer)'),
  replicationInterval: z.number().min(0).default(0).describe('Replication interval in seconds (0 = every frame)'),
  visibilityUpdateMode: z.enum(['Always', 'Once', 'Never']).default('Always').describe('When to update visibility'),
  // SceneMultiplayer properties
  authCallback: z.string().optional().describe('Authentication callback method name'),
  refuseNewConnections: z.boolean().default(false).describe('Refuse new connections'),
  allowObjectDecoding: z.boolean().default(false).describe('Allow object decoding (security risk)'),
  // ENetMultiplayerPeer properties
  serverPort: z.number().min(1).max(65535).default(7777).describe('Server port (for ENet)'),
  serverBindAddress: z.string().default('*').describe('Server bind address (for ENet)'),
  compressionMode: z.enum(['None', 'RangeCoder', 'FastLZ', 'Zlib', 'Zstd']).default('None').describe('Compression mode'),
  // WebSocketMultiplayerPeer properties
  supportedProtocols: z.array(z.string()).optional().describe('Supported WebSocket protocols'),
  handshakeHeaders: z.record(z.string(), z.string()).optional().describe('Handshake headers'),
  // Common properties
  transferMode: z.enum(['Unreliable', 'UnreliableOrdered', 'Reliable']).default('Reliable').describe('Default transfer mode'),
  channel: z.number().min(0).default(0).describe('Default channel'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createMultiplayerTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_multiplayer',
    name: 'Create Multiplayer Node',
    description: 'Create multiplayer nodes for networked games (spawners, synchronizers, peers).',
    category: 'networking',
    inputSchema: multiplayerSchema,
    handler: async (args: any) => {
      return handleCreateMultiplayer(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleCreateMultiplayer(
  args: z.infer<typeof multiplayerSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Build properties object
    const properties: Record<string, any> = args.properties || {};
    
    // Add node-specific properties
    if (args.nodeType === 'MultiplayerSpawner') {
      if (args.spawnPath) {
        properties.spawn_path = args.spawnPath;
      }
      properties.spawn_limit = args.spawnLimit;
      properties.auto_spawn = args.autoSpawn;
    }
    
    if (args.nodeType === 'MultiplayerSynchronizer') {
      if (args.rootPath) {
        properties.root_path = args.rootPath;
      }
      properties.replication_interval = args.replicationInterval;
      
      // Map visibility mode
      const visibilityMap = {
        'Always': 0,  // VISIBILITY_PROCESS_ALWAYS
        'Once': 1,    // VISIBILITY_PROCESS_ONCE
        'Never': 2    // VISIBILITY_PROCESS_NEVER
      };
      properties.visibility_update_mode = visibilityMap[args.visibilityUpdateMode];
    }
    
    if (args.nodeType === 'SceneMultiplayer') {
      if (args.authCallback) {
        properties.auth_callback = args.authCallback;
      }
      properties.refuse_new_connections = args.refuseNewConnections;
      properties.allow_object_decoding = args.allowObjectDecoding;
    }
    
    if (args.nodeType === 'ENetMultiplayerPeer') {
      properties.server_port = args.serverPort;
      properties.server_bind_address = args.serverBindAddress;
      
      // Map compression mode
      const compressionMap = {
        'None': 0,        // COMPRESS_NONE
        'RangeCoder': 1,  // COMPRESS_RANGE_CODER
        'FastLZ': 2,      // COMPRESS_FASTLZ
        'Zlib': 3,        // COMPRESS_ZLIB
        'Zstd': 4         // COMPRESS_ZSTD
      };
      properties.compression_mode = compressionMap[args.compressionMode];
    }
    
    if (args.nodeType === 'WebSocketMultiplayerPeer') {
      if (args.supportedProtocols) {
        properties.supported_protocols = args.supportedProtocols;
      }
      if (args.handshakeHeaders) {
        properties.handshake_headers = args.handshakeHeaders;
      }
    }
    
    // Add common properties
    const transferModeMap = {
      'Unreliable': 0,        // TRANSFER_MODE_UNRELIABLE
      'UnreliableOrdered': 1, // TRANSFER_MODE_UNRELIABLE_ORDERED
      'Reliable': 2           // TRANSFER_MODE_RELIABLE
    };
    properties.transfer_mode = transferModeMap[args.transferMode];
    properties.channel = args.channel;

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
    
    // Add node-specific info
    if (args.nodeType === 'MultiplayerSpawner' && args.spawnPath) {
      response += `\nSpawn scene: ${args.spawnPath}`;
    }
    
    if (args.nodeType === 'ENetMultiplayerPeer') {
      response += `\nPort: ${args.serverPort}, Compression: ${args.compressionMode}`;
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