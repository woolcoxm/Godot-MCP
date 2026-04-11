import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerEditorTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_get_editor_state",
    "Get the current editor state",
    {},
    async () => {
      const result = await godot.sendRequest("editor/get_state", {});
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
    "godot_select_node",
    "Select a node in the editor",
    {
      path: z.string(),
    },
    async (params) => {
      const result = await godot.sendRequest("editor/select_node", params);
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
    "godot_focus_in_viewport",
    "Focus on a node in the 3D viewport",
    {
      path: z.string().optional().describe("Node path to focus, defaults to selected node"),
    },
    async (params) => {
      const result = await godot.sendRequest("editor/focus_viewport", params);
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
    "godot_get_output_log",
    "Get the editor output log",
    {
      max_lines: z.number().optional().describe("Maximum number of lines to return"),
      filter: z.enum(["all", "errors", "warnings"]).optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("editor/get_output_log", params);
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
