import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const rpcPacketSchema = z.object({
  scriptPath: z.string().describe('Path to GDScript file to modify'),
  methodName: z.string().describe('Name of the method to make into RPC'),
  rpcMode: z.enum([
    'Authority', 'AnyPeer', 'AnyPeerAuthority', 'CallLocal', 
    'CallRemote', 'CallLocalAuthority', 'CallRemoteAuthority'
  ]).default('Authority').describe('RPC mode for the method'),
  transferMode: z.enum(['Unreliable', 'UnreliableOrdered', 'Reliable']).default('Reliable').describe('Transfer mode for RPC calls'),
  channel: z.number().min(0).default(0).describe('Channel for RPC calls'),
  callLocal: z.boolean().default(true).describe('Also call locally when invoking RPC'),
  // For packet tools
  operation: z.enum(['add_rpc', 'send_packet', 'receive_packet']).default('add_rpc').describe('Operation to perform'),
  // For packet sending
  targetPeer: z.number().optional().describe('Target peer ID (0 = server, 1 = broadcast, >1 = specific peer)'),
  packetData: z.string().optional().describe('Packet data as JSON string'),
  packetType: z.enum(['Text', 'Binary']).default('Text').describe('Type of packet data'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createRPCPacketTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_manage_rpc_packet',
    name: 'Manage RPC/Packet Operations',
    description: 'Add RPC annotations to methods or send/receive raw packets in multiplayer.',
    category: 'networking',
    inputSchema: rpcPacketSchema,
    handler: async (args: any) => {
      return handleRPCPacket(args, transport);
    },
    readOnlyHint: false,
    destructiveHint: true,
idempotentHint: false
  };
}

async function handleRPCPacket(
  args: z.infer<typeof rpcPacketSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    if (args.operation === 'add_rpc') {
      // Add RPC annotation to a method in a script
      const rpcModeMap = {
        'Authority': 'authority',
        'AnyPeer': 'any_peer',
        'AnyPeerAuthority': 'any_peer_authority',
        'CallLocal': 'call_local',
        'CallRemote': 'call_remote',
        'CallLocalAuthority': 'call_local_authority',
        'CallRemoteAuthority': 'call_remote_authority'
      };
      
      const transferModeMap = {
        'Unreliable': 'unreliable',
        'UnreliableOrdered': 'unreliable_ordered',
        'Reliable': 'reliable'
      };
      
      // Build RPC annotation string
      const rpcAnnotation = `@rpc("${rpcModeMap[args.rpcMode]}", "${transferModeMap[args.transferMode]}", ${args.channel}, ${args.callLocal})`;
      
      const result = await transport.execute({
        operation: 'modify_script',
        params: {
          scriptPath: args.scriptPath,
          modifications: [{
            type: 'add_annotation',
            methodName: args.methodName,
            annotation: rpcAnnotation
          }]
        }
      });

      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `Failed to add RPC annotation: ${result.error}`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `Added RPC annotation to method "${args.methodName}" in ${args.scriptPath}\nMode: ${args.rpcMode}, Transfer: ${args.transferMode}, Channel: ${args.channel}`
        }]
      };
      
    } else if (args.operation === 'send_packet') {
      // Send raw packet
      if (!args.packetData) {
        return {
          content: [{
            type: 'text',
            text: 'Packet data is required for send_packet operation'
          }]
        };
      }
      
      const result = await transport.execute({
        operation: 'send_packet',
        params: {
          targetPeer: args.targetPeer || 1, // Default to broadcast
          data: args.packetData,
          type: args.packetType === 'Binary' ? 1 : 0,
          channel: args.channel,
          transferMode: args.transferMode === 'Unreliable' ? 0 : 
                       args.transferMode === 'UnreliableOrdered' ? 1 : 2
        }
      });

      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `Failed to send packet: ${result.error}`
          }]
        };
      }

      const targetDesc = args.targetPeer === 0 ? 'server' : 
                        args.targetPeer === 1 ? 'broadcast' : 
                        `peer ${args.targetPeer}`;
      
      return {
        content: [{
          type: 'text',
          text: `Sent ${args.packetType.toLowerCase()} packet to ${targetDesc}\nSize: ${args.packetData.length} bytes, Channel: ${args.channel}`
        }]
      };
      
    } else if (args.operation === 'receive_packet') {
      // Configure packet reception
      const result = await transport.execute({
        operation: 'configure_packet_reception',
        params: {
          channel: args.channel,
          transferMode: args.transferMode === 'Unreliable' ? 0 : 
                       args.transferMode === 'UnreliableOrdered' ? 1 : 2,
          properties: args.properties || {}
        }
      });

      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `Failed to configure packet reception: ${result.error}`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `Configured packet reception on channel ${args.channel}\nTransfer mode: ${args.transferMode}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Unknown operation: ${args.operation}`
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error in RPC/packet operation: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}