import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerUiTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_control",
    "Create a UI control node",
    {
      parent_path: z.string(),
      control_type: z.string().describe("Control node class (Button, Label, LineEdit, TextEdit, HSlider, VSlider, CheckBox, CheckButton, OptionButton, TextureRect, Panel, ColorRect, etc.)"),
      name: z.string().optional(),
      properties: z.record(z.unknown()).optional().describe("Control properties: text, size, position, anchor_left, anchor_right, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("ui/create_control", params);
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
    "godot_create_layout",
    "Create a layout container node",
    {
      parent_path: z.string(),
      layout_type: z.enum(["vbox", "hbox", "grid", "margin", "center", "panel", "panel_container", "tab_container", "window"]).describe("Layout container type"),
      name: z.string().optional(),
      properties: z.record(z.unknown()).optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("ui/create_layout", params);
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
    "godot_set_control_properties",
    "Set properties on a UI control node",
    {
      path: z.string(),
      properties: z.record(z.unknown()).describe("Control properties to set"),
    },
    async (params) => {
      const result = await godot.sendRequest("ui/set_properties", params);
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
