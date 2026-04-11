import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerScriptTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_script",
    "Create a new GDScript file",
    {
      path: z.string().describe("Script file path (res://...gd)"),
      content: z.string().describe("GDScript source code"),
      extends_class: z.string().optional().describe("Class to extend (e.g. 'Node3D', 'Resource')"),
      class_name: z.string().optional().describe("Optional global class name"),
    },
    async (params) => {
      const result = await godot.sendRequest("script/create", params);
      if (result.success === false) {
        return {
          content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );

  server.tool(
    "godot_attach_script",
    "Attach a script to a node",
    {
      node_path: z.string(),
      script_path: z.string(),
    },
    async (params) => {
      const result = await godot.sendRequest("script/attach", params);
      if (result.success === false) {
        return {
          content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );

  server.tool(
    "godot_read_script",
    "Read the contents of a script file",
    {
      path: z.string().describe("Script resource path (res://...gd)"),
    },
    async (params) => {
      const result = await godot.sendRequest("script/read", params);
      if (result.success === false) {
        return {
          content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );

  server.tool(
    "godot_edit_script",
    "Edit/replace the contents of a script file",
    {
      path: z.string(),
      content: z.string().describe("New script content"),
    },
    async (params) => {
      const result = await godot.sendRequest("script/edit", params);
      if (result.success === false) {
        return {
          content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );

  server.tool(
    "godot_set_script_variable",
    "Set a variable value on a scripted node at runtime",
    {
      node_path: z.string(),
      variable_name: z.string(),
      value: z.unknown(),
    },
    async (params) => {
      const result = await godot.sendRequest("script/set_variable", params);
      if (result.success === false) {
        return {
          content: [{ type: "text" as const, text: result?.error || "Unknown error" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );
}
