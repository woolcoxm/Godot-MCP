import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerPhysicsTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_add_collision_shape",
    "Add a collision shape to a node",
    {
      parent_path: z.string(),
      shape_type: z.enum(["box", "sphere", "capsule", "cylinder", "convex_polygon", "concave_polygon", "world_boundary", "separation_ray"]),
      name: z.string().optional(),
      size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe("Size for box shape"),
      radius: z.number().optional(),
      height: z.number().optional(),
      points: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })).optional().describe("Points for polygon shapes"),
      disabled: z.boolean().optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("physics/add_collision_shape", params);
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
    "godot_create_physics_body",
    "Create a physics body node (RigidBody3D, StaticBody3D, CharacterBody3D, or Area3D)",
    {
      parent_path: z.string(),
      body_type: z.enum(["rigid", "static", "character", "area"]),
      name: z.string().optional(),
      collision_shape_type: z.enum(["box", "sphere", "capsule", "cylinder"]).optional(),
      collision_size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      collision_radius: z.number().optional(),
      collision_height: z.number().optional(),
      mass: z.number().optional(),
      physics_properties: z.record(z.unknown()).optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("physics/create_body", params);
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
    "godot_set_physics_properties",
    "Set physics properties on a body node",
    {
      path: z.string(),
      properties: z.record(z.unknown()).describe("Physics properties: mass, friction, bounce, gravity_scale, linear_damping, angular_damping, contact_monitor, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("physics/set_properties", params);
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
    "godot_ray_cast",
    "Perform a physics ray cast between two points",
    {
      from: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      to: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      exclude: z.array(z.string()).optional().describe("Node paths to exclude"),
      collision_mask: z.number().optional(),
      collide_with_bodies: z.boolean().optional(),
      collide_with_areas: z.boolean().optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("physics/ray_cast", params);
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
    "godot_shape_cast",
    "Perform a physics shape cast between two points",
    {
      shape_type: z.enum(["box", "sphere", "capsule", "cylinder"]),
      from: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      to: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
      radius: z.number().optional(),
      height: z.number().optional(),
      margin: z.number().optional(),
      exclude: z.array(z.string()).optional(),
      collision_mask: z.number().optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("physics/shape_cast", params);
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
