import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerResourceTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_texture",
    "Create a texture resource",
    {
      path: z.string().describe("Resource path to save (res://...tres or res://...png)"),
      width: z.number(),
      height: z.number(),
      type: z.enum(["solid_color", "gradient", "noise", "checkerboard", "blank"]).optional().describe("Procedural texture type"),
      color: z.string().optional().describe("Color for solid_color type (#RRGGBB)"),
      colors: z.array(z.string()).optional().describe("Colors for gradient (array of hex strings)"),
      noise_type: z.enum(["simplex", "perlin", "cellular", "value"]).optional(),
      noise_scale: z.number().optional(),
      format: z.enum(["rgba8", "rgb8", "la8", "l8", "rf", "rgf", "rgbf", "rgbaf"]).optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("resource/create_texture", params);
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
    "godot_import_resource",
    "Import a resource into the Godot project",
    {
      source_path: z.string().describe("Path to file to import (absolute or relative)"),
      destination: z.string().optional().describe("Destination path in res://. Defaults to same filename in res://"),
    },
    async (params) => {
      const result = await godot.sendRequest("resource/import", params);
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
    "godot_save_resource",
    "Save a resource from a node property to a file",
    {
      node_path: z.string().describe("Node path of the resource holder (e.g. material on MeshInstance3D)"),
      property: z.string().optional().describe("Property that holds the resource, defaults to 'material'"),
      save_path: z.string().describe("Path to save to (res://...tres)"),
    },
    async (params) => {
      const result = await godot.sendRequest("resource/save", params);
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
    "godot_list_resources",
    "List resources in the project",
    {
      type_filter: z.string().optional().describe("Resource type filter (e.g. 'Material', 'Texture', 'Mesh')"),
      path: z.string().optional().describe("Directory to search in"),
    },
    async (params) => {
      const result = await godot.sendRequest("resource/list", params);
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
