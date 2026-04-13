import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const enablePluginSchema = z.object({
  pluginName: z.string().describe('Name of the plugin to enable'),
  pluginPath: z.string().describe('Path to the plugin directory (e.g., "res://addons/my_plugin/")'),
});

const disablePluginSchema = z.object({
  pluginName: z.string().describe('Name of the plugin to disable'),
});

const listPluginsSchema = z.object({});

const configurePluginSchema = z.object({
  pluginName: z.string().describe('Name of the plugin to configure'),
  configuration: z.record(z.string(), z.any()).describe('Plugin configuration values'),
});

export function createEnablePluginTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_enable_plugin',
    name: 'Enable Plugin',
    description: 'Enable a Godot editor plugin in the project',
    category: 'project',
    inputSchema: enablePluginSchema,
    handler: async (args) => {
      // Check if plugin config file exists
      const configPath = `${args.pluginPath}/plugin.cfg`;
      const checkOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: configPath },
      };

      const checkResult = await transport.execute(checkOperation);
      
      if (!checkResult.success) {
        throw new Error(`Plugin config file not found: ${configPath}`);
      }

      // Enable the plugin in project settings
      const operation: TransportOperation = {
        operation: 'modify_project_settings',
        params: {
          section: 'plugins',
          key: args.pluginName,
          value: args.pluginPath,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to enable plugin');
      }

      return {
        pluginName: args.pluginName,
        pluginPath: args.pluginPath,
        configPath,
        message: `Enabled plugin "${args.pluginName}" from ${args.pluginPath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createDisablePluginTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_disable_plugin',
    name: 'Disable Plugin',
    description: 'Disable a Godot editor plugin in the project',
    category: 'project',
    inputSchema: disablePluginSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'remove_project_setting',
        params: {
          section: 'plugins',
          key: args.pluginName,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to disable plugin');
      }

      return {
        pluginName: args.pluginName,
        message: `Disabled plugin "${args.pluginName}"`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createListPluginsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_plugins',
    name: 'List Plugins',
    description: 'List all enabled plugins in the project',
    category: 'project',
    inputSchema: listPluginsSchema,
    handler: async () => {
      const operation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'plugins',
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read plugins');
      }

      const plugins = result.data || {};
      const pluginList = Object.keys(plugins).map(name => ({
        name,
        path: plugins[name],
        enabled: true,
      }));

      // Also check for potential plugins in addons directory
      const scanOperation: TransportOperation = {
        operation: 'list_directory',
        params: { path: 'res://addons/' },
      };

      const scanResult = await transport.execute(scanOperation);
      const availablePlugins: Array<{name: string, path: string, enabled: boolean}> = [...pluginList];

      if (scanResult.success && scanResult.data) {
        const addonDirs = scanResult.data.filter((item: string) => !item.startsWith('.'));
        
        for (const dir of addonDirs) {
          const pluginPath = `res://addons/${dir}`;
          const pluginName = dir;
          
          // Check if this plugin is already in the list
          if (!pluginList.some(p => p.name === pluginName)) {
            // Check if it has a plugin.cfg
            const checkCfgOp: TransportOperation = {
              operation: 'read_file',
              params: { path: `${pluginPath}/plugin.cfg` },
            };
            
            const cfgResult = await transport.execute(checkCfgOp);
            if (cfgResult.success) {
              availablePlugins.push({
                name: pluginName,
                path: pluginPath,
                enabled: false,
              });
            }
          }
        }
      }

      return {
        plugins: availablePlugins,
        enabledCount: pluginList.length,
        totalCount: availablePlugins.length,
        message: `Found ${pluginList.length} enabled plugins, ${availablePlugins.length} total available`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}

export function createConfigurePluginTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_configure_plugin',
    name: 'Configure Plugin',
    description: 'Configure plugin settings in the project',
    category: 'project',
    inputSchema: configurePluginSchema,
    handler: async (args) => {
      // Plugin configuration is typically stored in a separate config file
      // or in project settings under a plugin-specific section
      
      const configUpdates = [];
      
      for (const [key, value] of Object.entries(args.configuration)) {
        const operation: TransportOperation = {
          operation: 'modify_project_settings',
          params: {
            section: `plugin/${args.pluginName}`,
            key,
            value,
          },
        };

        const result = await transport.execute(operation);
        
        if (!result.success) {
          throw new Error(`Failed to set configuration "${key}" for plugin "${args.pluginName}": ${result.error}`);
        }
        
        configUpdates.push({ key, value });
      }

      return {
        pluginName: args.pluginName,
        configuration: args.configuration,
        updates: configUpdates,
        message: `Configured plugin "${args.pluginName}" with ${configUpdates.length} settings`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}