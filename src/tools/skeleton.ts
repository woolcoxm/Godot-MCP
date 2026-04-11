import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerSkeletonTools(server: McpServer, godot: GodotConnection): void {
  server.tool("godot_create_skeleton", "Create a Skeleton3D node with bones", {
    parent_path: z.string(),
    name: z.string().optional(),
    bones: z.array(z.object({
      name: z.string(),
      parent: z.string().optional(),
      rest_position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      rest_rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    })),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/create", params);
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

  server.tool("godot_get_skeleton_info", "Get information about a skeleton", {
    path: z.string().describe("Skeleton3D node path"),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/get_info", params);
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

  server.tool("godot_get_bone_pose", "Get the current pose of a bone", {
    path: z.string(),
    bone_name: z.string(),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/get_bone_pose", params);
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

  server.tool("godot_set_bone_pose", "Set the pose of a bone", {
    path: z.string(),
    bone_name: z.string(),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe("Euler rotation in degrees"),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/set_bone_pose", params);
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

  server.tool("godot_add_bone", "Add a bone to a skeleton", {
    path: z.string(),
    bone_name: z.string(),
    parent_bone_name: z.string().optional(),
    rest_position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rest_rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/add_bone", params);
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

  server.tool("godot_remove_bone", "Remove a bone from a skeleton", {
    path: z.string(),
    bone_name: z.string(),
    reassign_children_to: z.string().optional(),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/remove_bone", params);
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

  server.tool("godot_attach_to_bone", "Attach a node to a bone", {
    skeleton_path: z.string(),
    bone_name: z.string(),
    node_type: z.string().describe("Type of node to attach (e.g. MeshInstance3D, SpotLight3D)"),
    node_name: z.string().optional(),
    properties: z.record(z.unknown()).optional(),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/attach_to_bone", params);
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

  server.tool("godot_skin_bind", "Bind a mesh to a skeleton", {
    mesh_path: z.string(),
    skeleton_path: z.string(),
    bone_names: z.array(z.string()).optional().describe("Bone names for binding"),
  }, async (params) => {
    const result = await godot.sendRequest("skeleton/skin_bind", params);
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
