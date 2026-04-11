import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerNavigationTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_nav_region",
    "Create a navigation region",
    {
      parent_path: z.string(),
      name: z.string().optional(),
      vertices: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })).optional().describe("Navigation mesh vertices"),
      polygons: z.array(z.array(z.number())).optional().describe("Array of index arrays defining navigation mesh polygons"),
    },
    async (params) => {
      const result = await godot.sendRequest("navigation/create_region", params);
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
    "godot_get_nav_path",
    "Get a navigation path between two points",
    {
      region_path: z.string(),
      from: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      to: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      navigation_layers: z.number().optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("navigation/get_path", params);
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
    "godot_create_nav_agent",
    "Add a NavigationAgent3D to a node",
    {
      node_path: z.string().describe("Node to add NavigationAgent3D to"),
      agent_properties: z.record(z.unknown()).optional().describe("Agent properties: target_desired_distance, path_desired_distance, path_max_distance, radius, height, avoidance_enabled, avoidance_layers, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("navigation/create_agent", params);
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
