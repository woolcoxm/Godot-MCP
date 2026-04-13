import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const addToGroupSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to add to group'),
  groupName: z.string().describe('Name of the group to add the node to'),
});

const removeFromGroupSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to remove from group'),
  groupName: z.string().describe('Name of the group to remove the node from'),
});

const listNodeGroupsSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to list groups for'),
});

const listGroupNodesSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  groupName: z.string().describe('Name of the group to list nodes for'),
});

export function createAddToGroupTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_add_to_group',
    name: 'Add Node to Group',
    description: 'Add a node to a group in a scene',
    category: 'node',
    inputSchema: addToGroupSchema,
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

      // Initialize groups array if not present
      if (!node.groups) {
        node.groups = [];
      }

      // Check if already in group
      if (node.groups.includes(args.groupName)) {
        return {
          scenePath: args.scenePath,
          nodePath: args.nodePath,
          groupName: args.groupName,
          message: `Node ${args.nodePath} is already in group "${args.groupName}"`,
          readOnlyHint: false,
        };
      }

      // Add to group
      node.groups.push(args.groupName);

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
        nodePath: args.nodePath,
        groupName: args.groupName,
        message: `Added node ${args.nodePath} to group "${args.groupName}"`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createRemoveFromGroupTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_remove_from_group',
    name: 'Remove Node from Group',
    description: 'Remove a node from a group in a scene',
    category: 'node',
    inputSchema: removeFromGroupSchema,
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

      // Check if node has groups
      if (!node.groups || node.groups.length === 0) {
        return {
          scenePath: args.scenePath,
          nodePath: args.nodePath,
          groupName: args.groupName,
          message: `Node ${args.nodePath} is not in any groups`,
          readOnlyHint: false,
        };
      }

      // Check if in the specified group
      const groupIndex = node.groups.indexOf(args.groupName);
      if (groupIndex === -1) {
        return {
          scenePath: args.scenePath,
          nodePath: args.nodePath,
          groupName: args.groupName,
          message: `Node ${args.nodePath} is not in group "${args.groupName}"`,
          readOnlyHint: false,
        };
      }

      // Remove from group
      node.groups.splice(groupIndex, 1);

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
        nodePath: args.nodePath,
        groupName: args.groupName,
        message: `Removed node ${args.nodePath} from group "${args.groupName}"`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createListNodeGroupsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_node_groups',
    name: 'List Node Groups',
    description: 'List all groups a node belongs to',
    category: 'node',
    inputSchema: listNodeGroupsSchema,
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

      return {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        groups: node.groups || [],
        message: `Node ${args.nodePath} belongs to ${node.groups?.length || 0} groups`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}

export function createListGroupNodesTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_group_nodes',
    name: 'List Group Nodes',
    description: 'List all nodes in a specific group',
    category: 'node',
    inputSchema: listGroupNodesSchema,
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
      
      // Find all nodes in the specified group
      const nodesInGroup: Array<{path: string, name: string, type: string}> = [];
      
      const traverseNodes = (node: any, currentPath: string) => {
        const nodePath = currentPath === '.' ? node.name : `${currentPath}/${node.name}`;
        
        if (node.groups && node.groups.includes(args.groupName)) {
          nodesInGroup.push({
            path: nodePath,
            name: node.name,
            type: node.type,
          });
        }
        
        if (node.children) {
          for (const child of node.children) {
            traverseNodes(child, nodePath);
          }
        }
      };
      
      traverseNodes(sceneInfo.root, '.');
      
      return {
        scenePath: args.scenePath,
        groupName: args.groupName,
        nodes: nodesInGroup,
        count: nodesInGroup.length,
        message: `Found ${nodesInGroup.length} nodes in group "${args.groupName}"`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}