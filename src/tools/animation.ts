import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerAnimationTools(server: McpServer, godot: GodotConnection): void {
  server.tool("godot_create_animation_player", "Create an AnimationPlayer node", {
    parent_path: z.string(),
    name: z.string().optional(),
  }, async (params) => {
    const result = await godot.sendRequest("animation/create_player", params);
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

  server.tool("godot_create_animation", "Create a new animation resource", {
    player_path: z.string(),
    animation_name: z.string(),
    length: z.number().optional().describe("Duration in seconds, defaults to 1.0"),
    loop: z.boolean().optional(),
    step: z.number().optional().describe("Time step between keyframes"),
  }, async (params) => {
    const result = await godot.sendRequest("animation/create", params);
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

  server.tool("godot_add_animation_track", "Add a track to an animation", {
    player_path: z.string(),
    animation_name: z.string(),
    track_type: z.enum(["value", "position_3d", "rotation_3d", "scale_3d", "blend_shape"]),
    node_path: z.string(),
    property: z.string().optional().describe("Property path for value tracks (e.g. 'position:x')"),
    keyframes: z.array(z.object({ time: z.number(), value: z.unknown() })),
  }, async (params) => {
    const result = await godot.sendRequest("animation/add_track", params);
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

  server.tool("godot_play_animation", "Play an animation", {
    player_path: z.string(),
    animation_name: z.string(),
    speed: z.number().optional().describe("Playback speed scale"),
    from_end: z.boolean().optional(),
    blend: z.number().optional().describe("Blend time in seconds"),
  }, async (params) => {
    const result = await godot.sendRequest("animation/play", params);
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

  server.tool("godot_stop_animation", "Stop the currently playing animation", {
    player_path: z.string(),
    reset: z.boolean().optional().describe("Reset to start"),
  }, async (params) => {
    const result = await godot.sendRequest("animation/stop", params);
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

  server.tool("godot_seek_animation", "Seek to a specific time in the current animation", {
    player_path: z.string(),
    time: z.number().describe("Time in seconds to seek to"),
  }, async (params) => {
    const result = await godot.sendRequest("animation/seek", params);
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

  server.tool("godot_create_animation_tree", "Create an AnimationTree node", {
    parent_path: z.string(),
    name: z.string().optional(),
    tree_type: z.enum(["state_machine", "blend_tree", "one_shot"]).describe("Type of animation tree to create"),
  }, async (params) => {
    const result = await godot.sendRequest("animation/create_tree", params);
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

  server.tool("godot_set_animation_parameter", "Set a parameter on an AnimationTree", {
    tree_path: z.string(),
    parameter_name: z.string(),
    value: z.unknown(),
  }, async (params) => {
    const result = await godot.sendRequest("animation/set_parameter", params);
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

  server.tool("godot_get_animation_list", "List all animations in an AnimationPlayer", {
    player_path: z.string(),
  }, async (params) => {
    const result = await godot.sendRequest("animation/list", params);
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
