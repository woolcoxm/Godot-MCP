import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerInputTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_simulate_key",
    "Simulate a keyboard key press/release",
    {
      keycode: z.number().describe("Key code (e.g. 65 for A, 4194320 for Space). Use Godot Key constants."),
      pressed: z.boolean().optional().describe("true for press, false for release. Defaults to true (press then release)."),
      shift: z.boolean().optional(),
      ctrl: z.boolean().optional(),
      alt: z.boolean().optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("input/key", params);
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
    "godot_simulate_mouse_click",
    "Simulate a mouse button click at a position",
    {
      x: z.number(),
      y: z.number(),
      button_index: z.number().optional().describe("Mouse button (1=left, 2=right, 3=middle). Defaults to 1."),
      double_click: z.boolean().optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("input/mouse_click", params);
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
    "godot_simulate_mouse_move",
    "Simulate mouse movement to a position",
    {
      x: z.number(),
      y: z.number(),
      relative: z.boolean().optional().describe("If true, values are relative movement"),
    },
    async (params) => {
      const result = await godot.sendRequest("input/mouse_move", params);
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
    "godot_simulate_action",
    "Simulate an input action press/release",
    {
      action: z.string().describe("Input action name as defined in the InputMap"),
      pressed: z.boolean().optional().describe("true for press, false for release. Defaults to true."),
      strength: z.number().optional().describe("Action strength (0.0-1.0)"),
    },
    async (params) => {
      const result = await godot.sendRequest("input/action", params);
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
