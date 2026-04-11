import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerLightingTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_light",
    "Create a light node",
    {
      parent_path: z.string(),
      light_type: z.enum(["directional", "omni", "spot"]),
      name: z.string().optional(),
      properties: z.record(z.unknown()).optional().describe("Light properties: color, intensity, energy, shadow_enabled, shadow_blur, range, spot_angle, spot_range_attenuation, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("lighting/create", params);
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
    "godot_set_light_properties",
    "Set properties on an existing light node",
    {
      path: z.string(),
      properties: z.record(z.unknown()),
    },
    async (params) => {
      const result = await godot.sendRequest("lighting/set_properties", params);
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
    "godot_create_environment",
    "Create a WorldEnvironment node with environment settings",
    {
      parent_path: z.string().optional().describe("Parent node, defaults to root"),
      name: z.string().optional(),
      properties: z.record(z.unknown()).optional().describe("Environment properties: background_mode, background_color, sky, ambient_light, fog_enabled, fog_color, fog_density, tonemap_mode, tonemap_exposure, glow_enabled, ssao_enabled, ssr_enabled, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("lighting/create_environment", params);
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
    "godot_set_environment_property",
    "Set properties on a WorldEnvironment node",
    {
      path: z.string().describe("WorldEnvironment node path"),
      properties: z.record(z.unknown()),
    },
    async (params) => {
      const result = await godot.sendRequest("lighting/set_environment", params);
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
