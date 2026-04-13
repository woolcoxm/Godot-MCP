import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const addAutoloadSchema = z.object({
  name: z.string().describe('Name of the autoload (global variable name)'),
  path: z.string().describe('Path to the script or scene to autoload'),
  singleton: z.boolean().default(true).describe('Whether this is a singleton (only one instance)'),
});

const removeAutoloadSchema = z.object({
  name: z.string().describe('Name of the autoload to remove'),
});

const listAutoloadsSchema = z.object({});

const modifyAutoloadSchema = z.object({
  name: z.string().describe('Name of the autoload to modify'),
  newName: z.string().optional().describe('New name for the autoload'),
  newPath: z.string().optional().describe('New path for the autoload'),
  singleton: z.boolean().optional().describe('New singleton setting'),
});

export function createAddAutoloadTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_add_autoload',
    name: 'Add Autoload',
    description: 'Add a new autoload (global singleton) to the project',
    category: 'project',
    inputSchema: addAutoloadSchema,
    handler: async (args) => {
      // First, check if autoload already exists
      const readOperation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'autoload',
        },
      };

      const readResult = await transport.execute(readOperation);
      
      if (readResult.success && readResult.data && readResult.data[args.name]) {
        throw new Error(`Autoload with name "${args.name}" already exists`);
      }

      // Add the autoload
      const operation: TransportOperation = {
        operation: 'modify_project_settings',
        params: {
          section: 'autoload',
          key: args.name,
          value: `*"${args.path}"`,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add autoload');
      }

      return {
        name: args.name,
        path: args.path,
        singleton: args.singleton,
        message: `Added autoload "${args.name}" pointing to ${args.path}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createRemoveAutoloadTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_remove_autoload',
    name: 'Remove Autoload',
    description: 'Remove an autoload from the project',
    category: 'project',
    inputSchema: removeAutoloadSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'remove_project_setting',
        params: {
          section: 'autoload',
          key: args.name,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove autoload');
      }

      return {
        name: args.name,
        message: `Removed autoload "${args.name}"`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createListAutoloadsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_autoloads',
    name: 'List Autoloads',
    description: 'List all autoloads in the project',
    category: 'project',
    inputSchema: listAutoloadsSchema,
    handler: async () => {
      const operation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'autoload',
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read autoloads');
      }

      const autoloads = result.data || {};
      const autoloadList = Object.keys(autoloads).map(name => {
        const value = autoloads[name];
        const match = typeof value === 'string' ? value.match(/\*?"([^"]+)"/) : null;
        const path = match ? match[1] : value;
        
        return {
          name,
          path,
          singleton: typeof value === 'string' && value.startsWith('*'),
        };
      });

      return {
        autoloads: autoloadList,
        count: autoloadList.length,
        message: `Found ${autoloadList.length} autoloads`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}

export function createModifyAutoloadTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_modify_autoload',
    name: 'Modify Autoload',
    description: 'Modify an existing autoload in the project',
    category: 'project',
    inputSchema: modifyAutoloadSchema,
    handler: async (args) => {
      // First, read the current autoload
      const readOperation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'autoload',
          key: args.name,
        },
      };

      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data) {
        throw new Error(`Autoload "${args.name}" not found`);
      }

      const currentValue = readResult.data;
      const match = typeof currentValue === 'string' ? currentValue.match(/(\*?)"([^"]+)"/) : null;
      const currentSingleton = match ? match[1] === '*' : true;
      const currentPath = match ? match[2] : currentValue;

      // Determine new values
      const newName = args.newName || args.name;
      const newPath = args.newPath || currentPath;
      const newSingleton = args.singleton !== undefined ? args.singleton : currentSingleton;
      const newValue = `${newSingleton ? '*' : ''}"${newPath}"`;

      // If name changed, we need to remove old and add new
      if (args.newName && args.newName !== args.name) {
        // Remove old autoload
        const removeOperation: TransportOperation = {
          operation: 'remove_project_setting',
          params: {
            section: 'autoload',
            key: args.name,
          },
        };

        const removeResult = await transport.execute(removeOperation);
        
        if (!removeResult.success) {
          throw new Error(`Failed to remove old autoload "${args.name}"`);
        }
      }

      // Add/update autoload
      const updateOperation: TransportOperation = {
        operation: 'modify_project_settings',
        params: {
          section: 'autoload',
          key: newName,
          value: newValue,
        },
      };

      const updateResult = await transport.execute(updateOperation);
      
      if (!updateResult.success) {
        throw new Error(`Failed to update autoload`);
      }

      return {
        oldName: args.name,
        newName,
        oldPath: currentPath,
        newPath,
        oldSingleton: currentSingleton,
        newSingleton,
        message: `Modified autoload "${args.name}" -> "${newName}" (path: ${newPath}, singleton: ${newSingleton})`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}