import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const reparentNodeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to reparent'),
  newParentPath: z.string().describe('Path to the new parent node'),
});

const findNodeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  searchType: z.enum(['by_name', 'by_type', 'by_property']).describe('Type of search to perform'),
  searchValue: z.string().describe('Value to search for (name, type, or property name)'),
  propertyValue: z.any().optional().describe('Property value to match (required for property search)'),
  recursive: z.boolean().default(true).describe('Search recursively through children'),
});

const listChildrenSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  parentPath: z.string().describe('Path to the parent node'),
});

const moveNodeOrderSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to move'),
  newIndex: z.number().min(0).describe('New position index among siblings'),
});

const duplicateNodeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to duplicate'),
  newName: z.string().optional().describe('Name for the duplicated node (auto-generated if not provided)'),
  includeChildren: z.boolean().default(true).describe('Include child nodes in duplication'),
});

export function createReparentNodeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_reparent_node',
    name: 'Reparent Node',
    description: 'Move a node to a different parent in the scene hierarchy',
    category: 'node',
    inputSchema: reparentNodeSchema,
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
      
      // Find node to reparent
      const nodeToMove = SceneParser.findNodeByPath(sceneInfo, args.nodePath);
      if (!nodeToMove) {
        throw new Error(`Node not found: ${args.nodePath}`);
      }

      // Find new parent
      const newParent = SceneParser.findNodeByPath(sceneInfo, args.newParentPath);
      if (!newParent) {
        throw new Error(`New parent not found: ${args.newParentPath}`);
      }

      // Check if trying to reparent to itself or a descendant
      if (args.newParentPath === args.nodePath || args.newParentPath.startsWith(args.nodePath + '/')) {
        throw new Error(`Cannot reparent node to itself or its descendant`);
      }

      // Remove from old parent
      const oldParentPath = args.nodePath.substring(0, args.nodePath.lastIndexOf('/'));
      const oldParent = SceneParser.findNodeByPath(sceneInfo, oldParentPath === '' ? '.' : oldParentPath);
      
      if (oldParent && oldParent.children) {
        const nodeIndex = oldParent.children.findIndex((child: any) => 
          child.name === nodeToMove.name
        );
        if (nodeIndex !== -1) {
          oldParent.children.splice(nodeIndex, 1);
        }
      }

      // Add to new parent
      if (!newParent.children) {
        newParent.children = [];
      }
      
      // Update node's parent reference
      nodeToMove.parent = { path: args.newParentPath };
      
      // Add to new parent's children
      newParent.children.push(nodeToMove);

      // Update node paths for all descendants
      const updateDescendantPaths = (node: any, newBasePath: string) => {
        const nodePath = newBasePath === '.' ? node.name : `${newBasePath}/${node.name}`;
        
        // Update any signal connections involving this node
        if (sceneInfo.connections) {
          sceneInfo.connections.forEach(conn => {
            if (conn.source?.path === args.nodePath) {
              conn.source.path = nodePath;
            }
            if (conn.target?.path === args.nodePath) {
              conn.target.path = nodePath;
            }
          });
        }
        
        // Recursively update children
        if (node.children) {
          node.children.forEach((child: any) => {
            updateDescendantPaths(child, nodePath);
          });
        }
      };
      
      const newNodePath = args.newParentPath === '.' ? nodeToMove.name : `${args.newParentPath}/${nodeToMove.name}`;
      updateDescendantPaths(nodeToMove, args.newParentPath);

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
        newParentPath: args.newParentPath,
        newNodePath: newNodePath,
        message: `Reparented node from ${args.nodePath} to ${newNodePath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

export function createFindNodeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_find_node',
    name: 'Find Node',
    description: 'Search for nodes by name, type, or property value',
    category: 'node',
    inputSchema: findNodeSchema,
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
      
      const foundNodes: Array<{path: string, name: string, type: string, properties?: any}> = [];
      
      const searchNodes = (node: any, currentPath: string) => {
        const nodePath = currentPath === '.' ? node.name : `${currentPath}/${node.name}`;
        let match = false;
        
        switch (args.searchType) {
          case 'by_name':
            match = node.name === args.searchValue;
            break;
          case 'by_type':
            match = node.type === args.searchValue;
            break;
          case 'by_property':
            if (node.properties && node.properties[args.searchValue] !== undefined) {
              if (args.propertyValue !== undefined) {
                match = node.properties[args.searchValue] === args.propertyValue;
              } else {
                match = true; // Property exists
              }
            }
            break;
        }
        
        if (match) {
          foundNodes.push({
            path: nodePath,
            name: node.name,
            type: node.type,
            properties: node.properties,
          });
        }
        
        if (args.recursive && node.children) {
          node.children.forEach((child: any) => {
            searchNodes(child, nodePath);
          });
        }
      };
      
      searchNodes(sceneInfo.root, '.');
      
      return {
        scenePath: args.scenePath,
        searchType: args.searchType,
        searchValue: args.searchValue,
        propertyValue: args.propertyValue,
        foundNodes: foundNodes,
        count: foundNodes.length,
        message: `Found ${foundNodes.length} nodes matching search criteria`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}

export function createListChildrenTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_children',
    name: 'List Node Children',
    description: 'List all direct children of a node',
    category: 'node',
    inputSchema: listChildrenSchema,
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
      
      // Find parent node
      const parentNode = SceneParser.findNodeByPath(sceneInfo, args.parentPath);
      if (!parentNode) {
        throw new Error(`Parent node not found: ${args.parentPath}`);
      }

      const children = parentNode.children || [];
      
      return {
        scenePath: args.scenePath,
        parentPath: args.parentPath,
        children: children.map((child: any) => ({
          name: child.name,
          type: child.type,
          path: args.parentPath === '.' ? child.name : `${args.parentPath}/${child.name}`,
          hasChildren: !!(child.children && child.children.length > 0),
        })),
        count: children.length,
        message: `Found ${children.length} children for node ${args.parentPath}`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}

export function createMoveNodeOrderTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_move_node_order',
    name: 'Move Node Order',
    description: 'Change the order of a node among its siblings',
    category: 'node',
    inputSchema: moveNodeOrderSchema,
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
      
      // Find parent of the node
      const parentPath = args.nodePath.substring(0, args.nodePath.lastIndexOf('/'));
      const parent = SceneParser.findNodeByPath(sceneInfo, parentPath === '' ? '.' : parentPath);
      
      if (!parent || !parent.children) {
        throw new Error(`Parent node not found or has no children: ${parentPath}`);
      }

      // Find the node in parent's children
      const nodeName = args.nodePath.substring(args.nodePath.lastIndexOf('/') + 1);
      const nodeIndex = parent.children.findIndex((child: any) => child.name === nodeName);
      
      if (nodeIndex === -1) {
        throw new Error(`Node not found in parent's children: ${nodeName}`);
      }

      // Validate new index
      if (args.newIndex < 0 || args.newIndex >= parent.children.length) {
        throw new Error(`New index ${args.newIndex} is out of bounds (0-${parent.children.length - 1})`);
      }

      // Move the node
      const [node] = parent.children.splice(nodeIndex, 1);
      parent.children.splice(args.newIndex, 0, node);

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
        oldIndex: nodeIndex,
        newIndex: args.newIndex,
        message: `Moved node ${args.nodePath} from position ${nodeIndex} to ${args.newIndex}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

export function createDuplicateNodeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_duplicate_node',
    name: 'Duplicate Node',
    description: 'Create a copy of a node and its children',
    category: 'node',
    inputSchema: duplicateNodeSchema,
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
      
      // Find node to duplicate
      const sourceNode = SceneParser.findNodeByPath(sceneInfo, args.nodePath);
      if (!sourceNode) {
        throw new Error(`Node not found: ${args.nodePath}`);
      }

      // Find parent
      const parentPath = args.nodePath.substring(0, args.nodePath.lastIndexOf('/'));
      const parent = SceneParser.findNodeByPath(sceneInfo, parentPath === '' ? '.' : parentPath);
      
      if (!parent) {
        throw new Error(`Parent node not found: ${parentPath}`);
      }

      // Generate new name if not provided
      const newName = args.newName || `${sourceNode.name}_copy`;
      
      // Check if name already exists
      if (parent.children?.some((child: any) => child.name === newName)) {
        throw new Error(`Node with name "${newName}" already exists in parent`);
      }

      // Deep clone the node
      const cloneNode = (node: any): any => {
        const cloned = {
          ...node,
          name: node === sourceNode ? newName : node.name,
          children: args.includeChildren && node.children ? node.children.map(cloneNode) : [],
        };
        return cloned;
      };

      const duplicatedNode = cloneNode(sourceNode);

      // Add to parent's children
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(duplicatedNode);

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

      const newPath = parentPath === '.' ? newName : `${parentPath}/${newName}`;
      
      return {
        scenePath: args.scenePath,
        sourceNodePath: args.nodePath,
        duplicatedNodePath: newPath,
        newName: newName,
        includeChildren: args.includeChildren,
        message: `Duplicated node ${args.nodePath} to ${newPath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}