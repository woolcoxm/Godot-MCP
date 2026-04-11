import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerMaterialTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_material",
    "Create a new material resource or attach a material to a MeshInstance3D node",
    {
      parent_or_path: z.string().describe("Either parent node path to create a new material on a MeshInstance3D, or a resource path to save to (res://...tres)"),
      name: z.string().optional(),
      material_type: z.enum(["standard", "orm", "shaderless"]).optional(),
      properties: z.object({
        albedo_color: z.string().optional(),
        albedo_texture: z.string().optional(),
        metallic: z.number().optional(),
        roughness: z.number().optional(),
        emission_enabled: z.boolean().optional(),
        emission_color: z.string().optional(),
        emission_energy: z.number().optional(),
        normal_texture: z.string().optional(),
        normal_scale: z.number().optional(),
        transparency: z.boolean().optional(),
        alpha_scissor_threshold: z.number().optional(),
        uv1_scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        uv1_offset: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        cull_mode: z.enum(["disabled", "front", "back", "max"]).optional(),
        detail_uv_layer: z.enum(["uv1", "uv2"]).optional(),
        ao_light_affect: z.number().optional(),
        ssr_enabled: z.boolean().optional(),
        distance_fade_enabled: z.boolean().optional(),
        distance_fade_min_distance: z.number().optional(),
        distance_fade_max_distance: z.number().optional(),
      }).optional().describe("Material properties to set"),
    },
    async (params) => {
      const result = await godot.sendRequest("material/create", params);
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
    "godot_update_material",
    "Update properties of an existing material",
    {
      material_path: z.string().describe("Resource path of the material (res://...tres) or node path with material override"),
      properties: z.record(z.unknown()).describe("Properties to update"),
    },
    async (params) => {
      const result = await godot.sendRequest("material/update", params);
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
    "godot_create_shader",
    "Create a new shader resource file",
    {
      path: z.string().describe("Resource path to save shader (res://...tres)"),
      shader_code: z.string().describe("GLSL shader code (shader_type spatial; ...)"),
      parameters: z.record(z.unknown()).optional().describe("Initial shader parameter values"),
    },
    async (params) => {
      const result = await godot.sendRequest("material/create_shader", params);
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
    "godot_set_shader_param",
    "Set a shader parameter on a material",
    {
      material_path: z.string(),
      parameter_name: z.string(),
      value: z.unknown(),
    },
    async (params) => {
      const result = await godot.sendRequest("material/set_shader_param", params);
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
    "godot_apply_material",
    "Apply a material to a MeshInstance3D node",
    {
      material_path: z.string().describe("Resource path of the material"),
      node_path: z.string().describe("MeshInstance3D node path to apply material to"),
      surface_index: z.number().optional().describe("Surface index, defaults to 0"),
    },
    async (params) => {
      const result = await godot.sendRequest("material/apply", params);
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
