import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';
import { SceneInfo, NodeInfo } from '../../types/godot.js';

// Operation types
const operationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create_node'),
    parentPath: z.string(),
    nodeType: z.string(),
    nodeName: z.string(),
    properties: z.record(z.string(), z.any()).optional(),
    script: z.string().optional(),
    groups: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    type: z.literal('modify_node'),
    nodePath: z.string(),
    properties: z.record(z.string(), z.any()).optional(),
    setProperties: z.record(z.string(), z.any()).optional(),
    removeProperties: z.array(z.string()).optional(),
    addGroups: z.array(z.string()).optional(),
    removeGroups: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    type: z.literal('delete_node'),
    nodePath: z.string(),
  }),
  z.object({
    type: z.literal('reparent_node'),
    nodePath: z.string(),
    newParentPath: z.string(),
  }),
  z.object({
    type: z.literal('connect_signal'),
    sourceNodePath: z.string(),
    signalName: z.string(),
    targetNodePath: z.string(),
    targetMethod: z.string(),
    binds: z.array(z.any()).optional(),
    flags: z.number().optional(),
  }),
  z.object({
    type: z.literal('disconnect_signal'),
    sourceNodePath: z.string(),
    signalName: z.string(),
    targetNodePath: z.string(),
    targetMethod: z.string(),
  }),
  z.object({
    type: z.literal('add_to_group'),
    nodePath: z.string(),
    groupName: z.string(),
  }),
  z.object({
    type: z.literal('remove_from_group'),
    nodePath: z.string(),
    groupName: z.string(),
  }),
]);

const batchOperationsSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  operations: z.array(operationSchema).min(1).max(100).describe('Operations to apply as a batch'),
  validateBeforeApply: z.boolean().default(true).describe('Validate all operations before applying any'),
  createBackup: z.boolean().default(true).describe('Create a backup of the scene before applying changes'),
});

interface BatchOperationResult {
  type: string;
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export function createBatchOperationsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_batch_operations',
    name: 'Batch Scene Operations',
    description: 'Apply multiple scene modifications as a single transaction',
    category: 'scene',
    inputSchema: batchOperationsSchema,
    handler: async (args) => {
      // Read the scene first
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
      const results: BatchOperationResult[] = [];
      
      // Create backup if requested
      let backupContent: string | null = null;
      if (args.createBackup) {
        backupContent = readResult.data.content;
      }

      // Validate operations if requested
      if (args.validateBeforeApply) {
        for (const op of args.operations) {
          const validation = validateOperation(op, sceneInfo);
          if (!validation.valid) {
            throw new Error(`Operation validation failed: ${validation.error}`);
          }
        }
      }

      // Apply operations
      for (const op of args.operations) {
        try {
          const result = applyOperation(op, sceneInfo);
          results.push(result);
        } catch (error: any) {
          // If any operation fails and we have a backup, restore it
          if (backupContent) {
            const restoreOp: TransportOperation = {
              operation: 'write_file',
              params: {
                path: args.scenePath,
                content: backupContent,
              },
            };
            await transport.execute(restoreOp);
          }
          
          throw new Error(`Batch operation failed at step ${results.length + 1} (${op.type}): ${error.message}`);
        }
      }

      // Serialize and save the updated scene
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
        // Restore backup if save fails
        if (backupContent) {
          const restoreOp: TransportOperation = {
            operation: 'write_file',
            params: {
              path: args.scenePath,
              content: backupContent,
            },
          };
          await transport.execute(restoreOp);
        }
        
        throw new Error(`Failed to save scene: ${writeResult.error}`);
      }

      // Performance optimization: Compute operation counts in a single pass instead of multiple filter operations
      const { successfulOps, failedOps } = results.reduce((acc, r) => {
        if (r.success) acc.successfulOps++;
        else acc.failedOps++;
        return acc;
      }, { successfulOps: 0, failedOps: 0 });
      
      return {
        scenePath: args.scenePath,
        totalOperations: args.operations.length,
        successfulOperations: successfulOps,
        failedOperations: failedOps,
        results,
        backupCreated: args.createBackup,
        message: `Applied ${args.operations.length} operations (${successfulOps} successful, ${failedOps} failed)`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

function validateOperation(op: any, sceneInfo: SceneInfo): { valid: boolean; error?: string } {
  switch (op.type) {
    case 'create_node':
      // Check if parent exists
      if (op.parentPath !== '.') {
        const parent = SceneParser.findNodeByPath(sceneInfo, op.parentPath);
        if (!parent) {
          return { valid: false, error: `Parent node not found: ${op.parentPath}` };
        }
      }
      
      // Check if node name already exists in parent
      if (op.parentPath !== '.') {
        const parent = SceneParser.findNodeByPath(sceneInfo, op.parentPath);
        if (parent?.children?.some((child: any) => child.name === op.nodeName)) {
          return { valid: false, error: `Node with name "${op.nodeName}" already exists in parent` };
        }
      } else {
        // Root level - check if root has this name (shouldn't happen)
        if (sceneInfo.root.name === op.nodeName) {
          return { valid: false, error: `Root node already has name "${op.nodeName}"` };
        }
      }
      break;
      
    case 'modify_node':
    case 'delete_node':
    case 'reparent_node':
    case 'add_to_group':
    case 'remove_from_group':
      // Check if node exists
      const node = SceneParser.findNodeByPath(sceneInfo, op.nodePath);
      if (!node) {
        return { valid: false, error: `Node not found: ${op.nodePath}` };
      }
      
      if (op.type === 'reparent_node') {
        // Check if new parent exists
        if (op.newParentPath !== '.') {
          const newParent = SceneParser.findNodeByPath(sceneInfo, op.newParentPath);
          if (!newParent) {
            return { valid: false, error: `New parent not found: ${op.newParentPath}` };
          }
        }
        
        // Check if trying to reparent to itself or descendant
        if (op.newParentPath === op.nodePath || op.newParentPath.startsWith(op.nodePath + '/')) {
          return { valid: false, error: `Cannot reparent node to itself or its descendant` };
        }
        
        // Check if name already exists in new parent
        const nodeName = op.nodePath.substring(op.nodePath.lastIndexOf('/') + 1);
        if (op.newParentPath !== '.') {
          const newParent = SceneParser.findNodeByPath(sceneInfo, op.newParentPath);
          if (newParent?.children?.some((child: any) => child.name === nodeName)) {
            return { valid: false, error: `Node with name "${nodeName}" already exists in new parent` };
          }
        }
      }
      break;
      
    case 'connect_signal':
    case 'disconnect_signal':
      // Check if source node exists
      const sourceNode = SceneParser.findNodeByPath(sceneInfo, op.sourceNodePath);
      if (!sourceNode) {
        return { valid: false, error: `Source node not found: ${op.sourceNodePath}` };
      }
      
      // Check if target node exists
      const targetNode = SceneParser.findNodeByPath(sceneInfo, op.targetNodePath);
      if (!targetNode) {
        return { valid: false, error: `Target node not found: ${op.targetNodePath}` };
      }
      break;
  }
  
  return { valid: true };
}

function applyOperation(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  try {
    switch (op.type) {
      case 'create_node':
        return applyCreateNode(op, sceneInfo);
      case 'modify_node':
        return applyModifyNode(op, sceneInfo);
      case 'delete_node':
        return applyDeleteNode(op, sceneInfo);
      case 'reparent_node':
        return applyReparentNode(op, sceneInfo);
      case 'connect_signal':
        return applyConnectSignal(op, sceneInfo);
      case 'disconnect_signal':
        return applyDisconnectSignal(op, sceneInfo);
      case 'add_to_group':
        return applyAddToGroup(op, sceneInfo);
      case 'remove_from_group':
        return applyRemoveFromGroup(op, sceneInfo);
      default:
        return {
          type: op.type,
          success: false,
          message: `Unknown operation type: ${op.type}`,
          error: 'Unknown operation type',
        };
    }
  } catch (error: any) {
    return {
      type: op.type,
      success: false,
      message: `Failed to apply operation: ${error.message}`,
      error: error.message,
    };
  }
}

function applyCreateNode(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  const newNode: NodeInfo = {
    name: op.nodeName,
    type: op.nodeType,
    path: { path: '' }, // Will be set based on parent
    parent: { path: op.parentPath },
    children: [],
    properties: op.properties || {},
    groups: op.groups || [],
    metadata: op.metadata || {},
  };
  
  if (op.script) {
    newNode.script = { path: op.script };
  }
  
  // Find parent
  let parentNode: NodeInfo;
  if (op.parentPath === '.') {
    parentNode = sceneInfo.root;
  } else {
    const foundParent = SceneParser.findNodeByPath(sceneInfo, op.parentPath);
    if (!foundParent) {
      throw new Error(`Parent node not found: ${op.parentPath}`);
    }
    parentNode = foundParent;
  }
  
  // Initialize children array if not present
  if (!parentNode.children) {
    parentNode.children = [];
  }
  
  // Add to parent
  parentNode.children.push(newNode);
  
  const newNodePath = op.parentPath === '.' ? op.nodeName : `${op.parentPath}/${op.nodeName}`;
  
  return {
    type: 'create_node',
    success: true,
    message: `Created node ${op.nodeName} at ${newNodePath}`,
    details: {
      nodePath: newNodePath,
      nodeType: op.nodeType,
      parentPath: op.parentPath,
    },
  };
}

function applyModifyNode(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  const node = SceneParser.findNodeByPath(sceneInfo, op.nodePath);
  if (!node) {
    throw new Error(`Node not found: ${op.nodePath}`);
  }
  
  const modifications: string[] = [];
  
  // Update properties
  if (op.properties) {
    Object.assign(node.properties, op.properties);
    modifications.push(`${Object.keys(op.properties).length} properties updated`);
  }
  
  // Set specific properties (overwrites)
  if (op.setProperties) {
    for (const [key, value] of Object.entries(op.setProperties)) {
      node.properties[key] = value;
    }
    modifications.push(`${Object.keys(op.setProperties).length} properties set`);
  }
  
  // Remove properties
  if (op.removeProperties) {
    for (const key of op.removeProperties) {
      delete node.properties[key];
    }
    modifications.push(`${op.removeProperties.length} properties removed`);
  }
  
  // Add groups
  if (op.addGroups) {
    if (!node.groups) {
      node.groups = [];
    }
    for (const group of op.addGroups) {
      if (!node.groups.includes(group)) {
        node.groups.push(group);
      }
    }
    modifications.push(`${op.addGroups.length} groups added`);
  }
  
  // Remove groups
  if (op.removeGroups) {
    if (node.groups) {
      const initialCount = node.groups.length;
      node.groups = node.groups.filter(g => !op.removeGroups!.includes(g));
      modifications.push(`${initialCount - node.groups.length} groups removed`);
    }
  }
  
  // Update metadata
  if (op.metadata) {
    if (!node.metadata) {
      node.metadata = {};
    }
    Object.assign(node.metadata, op.metadata);
    modifications.push('metadata updated');
  }
  
  return {
    type: 'modify_node',
    success: true,
    message: `Modified node ${op.nodePath}: ${modifications.join(', ')}`,
    details: {
      nodePath: op.nodePath,
      modifications,
    },
  };
}

function applyDeleteNode(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  const node = SceneParser.findNodeByPath(sceneInfo, op.nodePath);
  if (!node) {
    throw new Error(`Node not found: ${op.nodePath}`);
  }
  
  // Find parent
  const parentPath = op.nodePath.substring(0, op.nodePath.lastIndexOf('/'));
  const parent = SceneParser.findNodeByPath(sceneInfo, parentPath === '' ? '.' : parentPath);
  
  if (parent && parent.children) {
    const nodeName = op.nodePath.substring(op.nodePath.lastIndexOf('/') + 1);
    const index = parent.children.findIndex((child: any) => child.name === nodeName);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
  }
  
  // Remove any connections involving this node
  if (sceneInfo.connections) {
    sceneInfo.connections = sceneInfo.connections.filter(conn => 
      conn.from.path !== op.nodePath && conn.to.path !== op.nodePath
    );
  }
  
  return {
    type: 'delete_node',
    success: true,
    message: `Deleted node ${op.nodePath}`,
    details: {
      nodePath: op.nodePath,
    },
  };
}

function applyReparentNode(op: any, _sceneInfo: SceneInfo): BatchOperationResult {
  // This is a complex operation that would require significant refactoring
  // For now, we'll return a placeholder implementation
  return {
    type: 'reparent_node',
    success: false,
    message: `Reparent operation not fully implemented in batch mode`,
    error: 'Not implemented',
    details: {
      nodePath: op.nodePath,
      newParentPath: op.newParentPath,
    },
  };
}

function applyConnectSignal(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  if (!sceneInfo.connections) {
    sceneInfo.connections = [];
  }
  
  // Check if connection already exists
  const existingConnection = sceneInfo.connections.find(conn =>
    conn.from.path === op.sourceNodePath &&
    conn.signal === op.signalName &&
    conn.to.path === op.targetNodePath &&
    conn.method === op.targetMethod
  );
  
  if (existingConnection) {
    return {
      type: 'connect_signal',
      success: true,
      message: `Signal connection already exists: ${op.signalName} from ${op.sourceNodePath} to ${op.targetNodePath}.${op.targetMethod}`,
      details: {
        sourceNodePath: op.sourceNodePath,
        signalName: op.signalName,
        targetNodePath: op.targetNodePath,
        targetMethod: op.targetMethod,
        alreadyExists: true,
      },
    };
  }
  
  // Add new connection
  sceneInfo.connections.push({
    from: { path: op.sourceNodePath },
    signal: op.signalName,
    to: { path: op.targetNodePath },
    method: op.targetMethod,
    binds: op.binds || [],
    flags: op.flags || 0,
  });
  
  return {
    type: 'connect_signal',
    success: true,
    message: `Connected signal ${op.signalName} from ${op.sourceNodePath} to ${op.targetNodePath}.${op.targetMethod}`,
    details: {
      sourceNodePath: op.sourceNodePath,
      signalName: op.signalName,
      targetNodePath: op.targetNodePath,
      targetMethod: op.targetMethod,
      binds: op.binds,
      flags: op.flags,
    },
  };
}

function applyDisconnectSignal(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  if (!sceneInfo.connections) {
    return {
      type: 'disconnect_signal',
      success: true,
      message: `No signal connections found in scene`,
      details: {
        sourceNodePath: op.sourceNodePath,
        signalName: op.signalName,
        targetNodePath: op.targetNodePath,
        targetMethod: op.targetMethod,
        notFound: true,
      },
    };
  }
  
  const initialLength = sceneInfo.connections.length;
  sceneInfo.connections = sceneInfo.connections.filter(conn =>
    !(conn.from.path === op.sourceNodePath &&
      conn.signal === op.signalName &&
      conn.to.path === op.targetNodePath &&
      conn.method === op.targetMethod)
  );
  
  if (sceneInfo.connections.length === initialLength) {
    return {
      type: 'disconnect_signal',
      success: true,
      message: `Signal connection not found: ${op.signalName} from ${op.sourceNodePath} to ${op.targetNodePath}.${op.targetMethod}`,
      details: {
        sourceNodePath: op.sourceNodePath,
        signalName: op.signalName,
        targetNodePath: op.targetNodePath,
        targetMethod: op.targetMethod,
        notFound: true,
      },
    };
  }
  
  return {
    type: 'disconnect_signal',
    success: true,
    message: `Disconnected signal ${op.signalName} from ${op.sourceNodePath} to ${op.targetNodePath}.${op.targetMethod}`,
    details: {
      sourceNodePath: op.sourceNodePath,
      signalName: op.signalName,
      targetNodePath: op.targetNodePath,
      targetMethod: op.targetMethod,
    },
  };
}

function applyAddToGroup(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  const node = SceneParser.findNodeByPath(sceneInfo, op.nodePath);
  if (!node) {
    throw new Error(`Node not found: ${op.nodePath}`);
  }
  
  if (!node.groups) {
    node.groups = [];
  }
  
  if (node.groups.includes(op.groupName)) {
    return {
      type: 'add_to_group',
      success: true,
      message: `Node ${op.nodePath} is already in group "${op.groupName}"`,
      details: {
        nodePath: op.nodePath,
        groupName: op.groupName,
        alreadyInGroup: true,
      },
    };
  }
  
  node.groups.push(op.groupName);
  
  return {
    type: 'add_to_group',
    success: true,
    message: `Added node ${op.nodePath} to group "${op.groupName}"`,
    details: {
      nodePath: op.nodePath,
      groupName: op.groupName,
    },
  };
}

function applyRemoveFromGroup(op: any, sceneInfo: SceneInfo): BatchOperationResult {
  const node = SceneParser.findNodeByPath(sceneInfo, op.nodePath);
  if (!node) {
    throw new Error(`Node not found: ${op.nodePath}`);
  }
  
  if (!node.groups || node.groups.length === 0) {
    return {
      type: 'remove_from_group',
      success: true,
      message: `Node ${op.nodePath} is not in any groups`,
      details: {
        nodePath: op.nodePath,
        groupName: op.groupName,
        notInGroup: true,
      },
    };
  }
  
  const groupIndex = node.groups.indexOf(op.groupName);
  if (groupIndex === -1) {
    return {
      type: 'remove_from_group',
      success: true,
      message: `Node ${op.nodePath} is not in group "${op.groupName}"`,
      details: {
        nodePath: op.nodePath,
        groupName: op.groupName,
        notInGroup: true,
      },
    };
  }
  
  node.groups.splice(groupIndex, 1);
  
  return {
    type: 'remove_from_group',
    success: true,
    message: `Removed node ${op.nodePath} from group "${op.groupName}"`,
    details: {
      nodePath: op.nodePath,
      groupName: op.groupName,
    },
  };
}