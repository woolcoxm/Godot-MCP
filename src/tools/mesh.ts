import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerMeshTools(server: McpServer, godot: GodotConnection): void {
  server.tool("godot_create_mesh_instance", "Create a primitive mesh instance", {
    parent_path: z.string(),
    mesh_type: z.enum(["box", "sphere", "cylinder", "capsule", "plane", "torus", "cone", "prism", "quad", "triangles"]).describe("Primitive mesh type"),
    name: z.string().optional(),
    material_properties: z.record(z.unknown()).optional().describe("StandardMaterial3D properties to apply"),
    mesh_properties: z.record(z.unknown()).optional().describe("Mesh properties (e.g. size, radius, height, segments, rings)"),
  }, async (params) => {
    const result = await godot.sendRequest("mesh/create_primitive", params);
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

  server.tool("godot_create_custom_mesh", "Create a mesh from custom vertex data", {
    parent_path: z.string(),
    name: z.string().optional(),
    vertices: z.array(z.number()).describe("Flat array of vertex positions [x1,y1,z1, x2,y2,z2, ...]"),
    indices: z.array(z.number()).optional().describe("Triangle indices"),
    normals: z.array(z.number()).optional().describe("Flat array of normals"),
    uvs: z.array(z.number()).optional().describe("Flat array of UV coordinates [u1,v1, u2,v2, ...]"),
    colors: z.array(z.number()).optional().describe("Flat array of vertex colors [r1,g1,b1,a1, ...] 0-1 range"),
    material_properties: z.record(z.unknown()).optional(),
  }, async (params) => {
    const result = await godot.sendRequest("mesh/create_custom", params);
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

  server.tool("godot_import_model", "Import a 3D model file", {
    file_path: z.string().describe("Path to model file (res:// or absolute)"),
    parent_path: z.string().optional(),
    name: z.string().optional(),
    generate_collisions: z.boolean().optional(),
  }, async (params) => {
    const result = await godot.sendRequest("mesh/import_model", params);
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

  server.tool("godot_get_mesh_info", "Get information about a mesh instance", {
    path: z.string().describe("MeshInstance3D node path"),
  }, async (params) => {
    const result = await godot.sendRequest("mesh/get_info", params);
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

  server.tool("godot_create_character_body", "Create a character body with optional skeleton and physics", {
    parent_path: z.string(),
    name: z.string().optional(),
    skeleton: z.object({
      bones: z.array(z.object({
        name: z.string(),
        parent: z.string().optional(),
        rest_position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
        rest_rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      })),
    }).optional(),
    body_mesh: z.object({
      type: z.enum(["capsule", "box", "sphere", "custom"]),
      radius: z.number().optional(),
      height: z.number().optional(),
      skin_bind: z.boolean().optional(),
      material_properties: z.record(z.unknown()).optional(),
      vertices: z.array(z.number()).optional(),
      indices: z.array(z.number()).optional(),
    }).optional(),
    physics: z.object({
      body_type: z.enum(["character", "rigid", "static", "area"]),
      collision_shape: z.enum(["capsule", "box", "sphere", "cylinder"]).optional(),
      collision_radius: z.number().optional(),
      collision_height: z.number().optional(),
      mass: z.number().optional(),
    }).optional(),
    animation_player: z.boolean().optional(),
  }, async (params) => {
    const result = await godot.sendRequest("mesh/create_character_body", params);
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
