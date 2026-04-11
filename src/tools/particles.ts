import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerParticlesTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_particles",
    "Create a GPU particles node",
    {
      parent_path: z.string(),
      name: z.string().optional(),
      properties: z.record(z.unknown()).optional().describe("GPUParticles3D properties: amount, lifetime, one_shot, explosiveness, randomness, speed_scale, emitting, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("particles/create", params);
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
    "godot_set_particles_config",
    "Set particle system configuration",
    {
      path: z.string(),
      config: z.record(z.unknown()).describe("Particle configuration: amount, lifetime, preprocess, speed_min, speed_max, direction, spread, gravity, tangential_accel, radial_accel, damping, scale_min, scale_max, color, color_ramp, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("particles/set_config", params);
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
    "godot_set_particles_material",
    "Set particle process material properties",
    {
      path: z.string(),
      properties: z.record(z.unknown()).describe("ParticleProcessMaterial properties: emission_shape, emission_sphere_radius, emission_box_extents, emission_point_texture, particle_flag_align_y, particle_flag_rotate_y, particle_flag_disable_z, turbulence_enabled, turbulence_strength, turbulence_noise_strength, turbulence_noise_speed, turbulence_noise_scale, attractor_enabled, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("particles/set_material", params);
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
