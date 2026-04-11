import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerSceneTools(server: McpServer, godot: GodotConnection): void {
  server.tool("godot_list_scenes", "List all scenes in the project", {}, async () => {
    const result = await godot.sendRequest("scene/list", {});
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

  server.tool("godot_open_scene", "Open a scene file", {
    path: z.string().describe("Scene file path (res://...tscn)"),
  }, async (params) => {
    const result = await godot.sendRequest("scene/open", params);
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

  server.tool("godot_save_scene", "Save the current scene", {}, async () => {
    const result = await godot.sendRequest("scene/save", {});
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

  server.tool("godot_save_scene_as", "Save the current scene to a new path", {
    path: z.string().describe("New file path (res://...tscn)"),
  }, async (params) => {
    const result = await godot.sendRequest("scene/save_as", params);
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

  server.tool("godot_new_scene", "Create a new scene", {
    root_type: z.string().optional().describe("Root node type, defaults to 'Node3D'"),
    root_name: z.string().optional().describe("Root node name"),
  }, async (params) => {
    const result = await godot.sendRequest("scene/new", params);
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

  server.tool("godot_get_scene_tree", "Get the full node tree hierarchy of the current scene", {}, async () => {
    const result = await godot.sendRequest("scene/get_tree", {});
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

  server.tool("godot_run_scene", "Run the current scene", {}, async () => {
    const result = await godot.sendRequest("scene/run", {});
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

  server.tool("godot_stop_scene", "Stop the running scene", {}, async () => {
    const result = await godot.sendRequest("scene/stop", {});
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

  server.tool("godot_pause_scene", "Pause or resume the running scene", {
    paused: z.boolean().optional().describe("true to pause, false to resume"),
  }, async (params) => {
    const result = await godot.sendRequest("scene/pause", params);
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

  server.tool("godot_get_viewport_screenshot", "Capture a screenshot of a viewport", {
    viewport_path: z.string().optional().describe("Viewport node path, defaults to main viewport"),
  }, async (params) => {
    const result = await godot.sendRequest("scene/screenshot", params);
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
