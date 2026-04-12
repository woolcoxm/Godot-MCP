import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { HeadlessBridge, HeadlessOperation } from '../../transports/headless-bridge.js';
import { SceneParser } from '../../utils/scene-parser.js';

const sceneTreeSchema = z.object({
  path: z.string().describe('Path to the scene file (e.g., "res://scenes/main.tscn")'),
  maxDepth: z.number().min(1).max(10).default(5).describe('Maximum depth to traverse'),
  includeProperties: z.boolean().default(false).describe('Include node properties in response'),
  includeScripts: z.boolean().default(true).describe('Include script references'),
  includeGroups: z.boolean().default(true).describe('Include node groups'),
});

export function createSceneTreeTool(bridge: HeadlessBridge): RegisteredTool {
  return {
    id: 'godot_scene_tree',
    name: 'Get Scene Tree',
    description: 'Get hierarchical tree structure of a scene',
    category: 'scene',
    inputSchema: sceneTreeSchema,
    handler: async (args) => {
      // Read the scene
      const readOperation: HeadlessOperation = {
        operation: 'read_scene',
        params: { path: args.path },
      };
      
      const readResult = await bridge.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read scene: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      // Parse the scene
      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      
      // Build tree structure
      const tree = buildNodeTree(
        sceneInfo.root,
        sceneInfo,
        args.maxDepth,
        args.includeProperties,
        args.includeScripts,
        args.includeGroups
      );

      return {
        path: args.path,
        root: tree,
        totalNodes: countNodes(tree),
        maxDepth: args.maxDepth,
      };
    },
    readOnlyHint: true,
    idempotentHint: true,
  };
}

function buildNodeTree(
  node: any,
  sceneInfo: any,
  maxDepth: number,
  includeProperties: boolean,
  includeScripts: boolean,
  includeGroups: boolean,
  currentDepth: number = 0
): any {
  if (currentDepth >= maxDepth) {
    return {
      name: node.name,
      type: node.type,
      path: node.path?.path || node.name,
      truncated: true,
    };
  }

  const treeNode: any = {
    name: node.name,
    type: node.type,
    path: node.path?.path || node.name,
  };

  if (includeProperties && node.properties && Object.keys(node.properties).length > 0) {
    treeNode.properties = node.properties;
  }

  if (includeScripts && node.script) {
    treeNode.script = node.script;
  }

  if (includeGroups && node.groups && node.groups.length > 0) {
    treeNode.groups = node.groups;
  }

  // Find children
  const children: any[] = [];
  if (node.children && Array.isArray(node.children)) {
    for (const childPath of node.children) {
      // Find child node in scene (simplified - would need proper lookup)
      // For now, create placeholder
      const childNode = {
        name: extractNodeName(childPath?.path || ''),
        type: 'Node', // Unknown without proper lookup
        path: childPath?.path || '',
        children: [],
      };
      
      children.push(buildNodeTree(
        childNode,
        sceneInfo,
        maxDepth,
        includeProperties,
        includeScripts,
        includeGroups,
        currentDepth + 1
      ));
    }
  }

  if (children.length > 0) {
    treeNode.children = children;
  }

  return treeNode;
}

function extractNodeName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

function countNodes(tree: any): number {
  let count = 1; // Count the current node
  
  if (tree.children && Array.isArray(tree.children)) {
    for (const child of tree.children) {
      count += countNodes(child);
    }
  }
  
  return count;
}