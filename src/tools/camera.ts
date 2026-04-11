import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerCameraTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_camera",
    "Create a Camera3D node",
    {
      parent_path: z.string(),
      name: z.string().optional(),
      properties: z.record(z.unknown()).optional().describe("Camera properties: fov, near, far, projection ('perspective'|'orthogonal'), current, h_offset, v_offset, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("camera/create", params);
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
    "godot_set_camera_properties",
    "Set properties on an existing camera node",
    {
      path: z.string(),
      properties: z.record(z.unknown()),
    },
    async (params) => {
      const result = await godot.sendRequest("camera/set_properties", params);
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
    "godot_get_camera_image",
    "Capture an image from a camera viewport",
    {
      path: z.string(),
      width: z.number().optional().describe("Image width, defaults to 1920"),
      height: z.number().optional().describe("Image height, defaults to 1080"),
    },
    async (params) => {
      const result = await godot.sendRequest("camera/get_image", params);
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
