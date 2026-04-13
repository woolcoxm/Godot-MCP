import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';
import { IdempotencyChecker } from '../../utils/idempotency.js';
import { NodeInfo } from '../../types/godot.js';

const createNodeSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/main.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  nodeType: z.string().default('Node').describe('Type of node to create (e.g., "Node3D", "Sprite2D", "Button")'),
  nodeName: z.string().describe('Name for the new node'),
  properties: z.record(z.string(), z.any()).optional().describe('Initial properties for the node'),
  script: z.string().optional().describe('Script to attach to the node (resource path)'),
  groups: z.array(z.string()).optional().describe('Groups to add the node to'),
  metadata: z.record(z.string(), z.any()).optional().describe('Metadata to attach to the node'),
  checkExisting: z.boolean().default(true).describe('Check if node already exists before creating'),
});

export function createCreateNodeTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_node',
    name: 'Create Node in Scene',
    description: 'Add a new child node to a scene at the specified parent',
    category: 'node',
    inputSchema: createNodeSchema,
    handler: async (args) => {
      // Create new node path
      const newNodePath = args.parentPath === '.' ? args.nodeName : `${args.parentPath}/${args.nodeName}`;
      
      // Check if node already exists (idempotency check)
      if (args.checkExisting) {
        const { exists, node } = await IdempotencyChecker.checkNodeExists(
          transport,
          args.scenePath,
          newNodePath
        );
        
        if (exists && node) {
          // Check if existing node matches requested properties
          const propertiesMatch = !args.properties || Object.entries(args.properties).every(
            ([key, value]) => node.properties[key] === value
          );
          
          const scriptMatch = !args.script || (typeof node.script === 'string' ? node.script === args.script : node.script?.path === args.script);
          
          const groupsMatch = !args.groups || (
            node.groups && 
            args.groups.every((group: string) => node.groups!.includes(group))
          );
          
          if (propertiesMatch && scriptMatch && groupsMatch) {
            return {
              scenePath: args.scenePath,
              nodePath: newNodePath,
              nodeType: node.type,
              nodeName: args.nodeName,
              alreadyExists: true,
              message: `Node ${args.nodeName} already exists at ${newNodePath} with matching properties`,
              readOnlyHint: false,
            };
          }
        }
      }
      
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

      // Parse the scene
      const sceneInfo = SceneParser.parseScene(readResult.data.content);
      
      // Check if parent exists
      let parentNode: NodeInfo;
      if (args.parentPath === '.') {
        parentNode = sceneInfo.root;
      } else {
        const foundParent = SceneParser.findNodeByPath(sceneInfo, args.parentPath);
        if (!foundParent) {
          throw new Error(`Parent node not found: ${args.parentPath}`);
        }
        parentNode = foundParent;
      }
      
      // Check if node with same name already exists in parent
      if (parentNode.children?.some((child: any) => child.name === args.nodeName)) {
        throw new Error(`Node with name "${args.nodeName}" already exists in parent ${args.parentPath}`);
      }
      
      // Create new node
      const newNode: NodeInfo = {
        name: args.nodeName,
        type: args.nodeType,
        path: { path: newNodePath },
        parent: { path: args.parentPath },
        children: [],
        properties: args.properties || {},
        groups: args.groups || [],
        metadata: args.metadata || {},
      };
      
      if (args.script) {
        newNode.script = { path: args.script };
      }
      
      // Add to parent's children
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(newNode);
      
      // Serialize updated scene
      const updatedContent = SceneParser.serializeScene(sceneInfo);
      
      // Write back to file
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
        nodePath: newNodePath,
        nodeType: args.nodeType,
        nodeName: args.nodeName,
        created: true,
        message: `Node ${args.nodeName} created at ${newNodePath} in ${args.scenePath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}