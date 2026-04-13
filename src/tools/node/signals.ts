import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const connectSignalSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  sourceNodePath: z.string().describe('Path to the node emitting the signal'),
  signalName: z.string().describe('Name of the signal to connect'),
  targetNodePath: z.string().describe('Path to the node with the target method'),
  targetMethod: z.string().describe('Name of the method to call when signal is emitted'),
  binds: z.array(z.any()).optional().describe('Additional arguments to bind to the connection'),
  flags: z.number().default(0).describe('Connection flags (0 = default, 1 = deferred, 2 = oneshot, 3 = deferred|oneshot)'),
});

const disconnectSignalSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  sourceNodePath: z.string().describe('Path to the node emitting the signal'),
  signalName: z.string().describe('Name of the signal to disconnect'),
  targetNodePath: z.string().describe('Path to the target node'),
  targetMethod: z.string().describe('Name of the target method'),
});

const listSignalsSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to list signals for'),
});

export function createConnectSignalTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_connect_signal',
    name: 'Connect Signal',
    description: 'Connect a signal from one node to a method on another node',
    category: 'node',
    inputSchema: connectSignalSchema,
    handler: async (args) => {
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read scene: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      
      // Find source node
      const sourceNode = SceneParser.findNodeByPath(sceneInfo, args.sourceNodePath);
      if (!sourceNode) {
        throw new Error(`Source node not found: ${args.sourceNodePath}`);
      }

      // Find target node
      const targetNode = SceneParser.findNodeByPath(sceneInfo, args.targetNodePath);
      if (!targetNode) {
        throw new Error(`Target node not found: ${args.targetNodePath}`);
      }

      // Add signal connection to scene
      if (!sceneInfo.connections) {
        sceneInfo.connections = [];
      }

      // Check if connection already exists
      const existingConnection = sceneInfo.connections.find(conn =>
        conn.source?.path === args.sourceNodePath &&
        conn.signal === args.signalName &&
        conn.target?.path === args.targetNodePath &&
        conn.method === args.targetMethod
      );

      if (existingConnection) {
        return {
          scenePath: args.scenePath,
          sourceNodePath: args.sourceNodePath,
          signalName: args.signalName,
          targetNodePath: args.targetNodePath,
          targetMethod: args.targetMethod,
          message: `Signal connection already exists: ${args.signalName} from ${args.sourceNodePath} to ${args.targetNodePath}.${args.targetMethod}`,
          readOnlyHint: false,
        };
      }

      // Add new connection
      sceneInfo.connections.push({
        source: { path: args.sourceNodePath },
        signal: args.signalName,
        target: { path: args.targetNodePath },
        method: args.targetMethod,
        binds: args.binds || [],
        flags: args.flags,
      });

      // Serialize and save
      const updatedContent = SceneParser.serializeScene(sceneInfo);
      
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.scenePath,
          content: updatedContent,
        },
      };

      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to save scene: ${writeResult.error}`);
      }

      return {
        scenePath: args.scenePath,
        sourceNodePath: args.sourceNodePath,
        signalName: args.signalName,
        targetNodePath: args.targetNodePath,
        targetMethod: args.targetMethod,
        message: `Connected signal ${args.signalName} from ${args.sourceNodePath} to ${args.targetNodePath}.${args.targetMethod}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createDisconnectSignalTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_disconnect_signal',
    name: 'Disconnect Signal',
    description: 'Disconnect a signal connection between nodes',
    category: 'node',
    inputSchema: disconnectSignalSchema,
    handler: async (args) => {
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read scene: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      
      if (!sceneInfo.connections) {
        return {
          scenePath: args.scenePath,
          sourceNodePath: args.sourceNodePath,
          signalName: args.signalName,
          message: `No signal connections found in scene`,
          readOnlyHint: false,
        };
      }

      // Find and remove the connection
      const initialLength = sceneInfo.connections.length;
      sceneInfo.connections = sceneInfo.connections.filter(conn =>
        !(conn.source?.path === args.sourceNodePath &&
          conn.signal === args.signalName &&
          conn.target?.path === args.targetNodePath &&
          conn.method === args.targetMethod)
      );

      if (sceneInfo.connections.length === initialLength) {
        return {
          scenePath: args.scenePath,
          sourceNodePath: args.sourceNodePath,
          signalName: args.signalName,
          targetNodePath: args.targetNodePath,
          targetMethod: args.targetMethod,
          message: `Signal connection not found: ${args.signalName} from ${args.sourceNodePath} to ${args.targetNodePath}.${args.targetMethod}`,
          readOnlyHint: false,
        };
      }

      // Serialize and save
      const updatedContent = SceneParser.serializeScene(sceneInfo);
      
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.scenePath,
          content: updatedContent,
        },
      };

      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to save scene: ${writeResult.error}`);
      }

      return {
        scenePath: args.scenePath,
        sourceNodePath: args.sourceNodePath,
        signalName: args.signalName,
        targetNodePath: args.targetNodePath,
        targetMethod: args.targetMethod,
        message: `Disconnected signal ${args.signalName} from ${args.sourceNodePath} to ${args.targetNodePath}.${args.targetMethod}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createListSignalsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_signals',
    name: 'List Node Signals',
    description: 'List all signal connections for a node',
    category: 'node',
    inputSchema: listSignalsSchema,
    handler: async (args) => {
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read scene: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      
      // Find node
      const node = SceneParser.findNodeByPath(sceneInfo, args.nodePath);
      if (!node) {
        throw new Error(`Node not found: ${args.nodePath}`);
      }

      // Get signals for this node
      const signals = sceneInfo.connections?.filter(conn => 
        conn.source?.path === args.nodePath
      ) || [];

      // Also get signals targeting this node
      const incomingSignals = sceneInfo.connections?.filter(conn => 
        conn.target?.path === args.nodePath
      ) || [];

      return {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        emittedSignals: signals.map(conn => ({
          signal: conn.signal,
          target: conn.target?.path,
          method: conn.method,
          flags: conn.flags,
          binds: conn.binds,
        })),
        receivedSignals: incomingSignals.map(conn => ({
          signal: conn.signal,
          source: conn.source?.path,
          method: conn.method,
          flags: conn.flags,
          binds: conn.binds,
        })),
        message: `Found ${signals.length} emitted signals and ${incomingSignals.length} received signals for node ${args.nodePath}`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}