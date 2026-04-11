import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerProjectTools(server: McpServer, godot: GodotConnection): void {
  server.tool("godot_get_project_info", "Returns project name, version, resolution, etc.", {}, async () => {
    const result = await godot.sendRequest("project/info", {});
    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
    };
  });

  server.tool("godot_get_project_settings", "Get project settings", {
    setting_keys: z.array(z.string()).optional().describe("Array of setting keys to retrieve. If omitted, returns all settings."),
  }, async (params) => {
    const result = await godot.sendRequest("project/get_settings", params);
    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
    };
  });

  server.tool("godot_set_project_setting", "Set a project setting", {
    key: z.string(),
    value: z.unknown().describe("Value to set (string, number, bool, etc)"),
  }, async (params) => {
    const result = await godot.sendRequest("project/set_setting", params);
    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
    };
  });

  server.tool("godot_get_file_system", "List files in the project filesystem", {
    path: z.string().optional().describe("Directory path relative to res://, defaults to root"),
    recursive: z.boolean().optional().describe("Whether to list recursively, defaults to true"),
    pattern: z.string().optional().describe("Optional glob filter (e.g. '*.tscn')"),
  }, async (params) => {
    const result = await godot.sendRequest("project/list_files", params);
    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
    };
  });

  server.tool("godot_read_file", "Read a file from the project", {
    path: z.string().describe("File path relative to res://"),
  }, async (params) => {
    const result = await godot.sendRequest("project/read_file", params);
    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
    };
  });

  server.tool("godot_write_file", "Write content to a file in the project", {
    path: z.string().describe("File path relative to res://"),
    content: z.string().describe("Content to write"),
  }, async (params) => {
    const result = await godot.sendRequest("project/write_file", params);
    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
    };
  });
}
