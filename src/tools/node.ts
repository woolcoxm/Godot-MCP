import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerNodeTools(server: McpServer, godot: GodotConnection): void {
  server.tool("godot_add_node", "Add a node to the scene tree", {
    parent_path: z.string(),
    node_type: z.string().describe("Godot class name (e.g. MeshInstance3D, RigidBody3D)"),
    node_name: z.string().optional(),
    properties: z.record(z.unknown()).optional().describe("Properties to set on the node"),
  }, async (params) => {
    const result = await godot.sendRequest("node/add", params);
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

  server.tool("godot_remove_node", "Remove a node from the scene tree", {
    path: z.string(),
    queue_free: z.boolean().optional().describe("Use queue_free (deferred) instead of remove_child. Defaults to true"),
  }, async (params) => {
    const result = await godot.sendRequest("node/remove", params);
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

  server.tool("godot_duplicate_node", "Duplicate a node in the scene tree", {
    path: z.string(),
    new_name: z.string().optional(),
    new_parent_path: z.string().optional(),
  }, async (params) => {
    const result = await godot.sendRequest("node/duplicate", params);
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

  server.tool("godot_get_node", "Get information about a node", {
    path: z.string(),
    include_properties: z.boolean().optional().describe("Include node properties in response. Defaults to false"),
  }, async (params) => {
    const result = await godot.sendRequest("node/get", params);
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

  server.tool("godot_get_node_property", "Get a specific property of a node", {
    path: z.string(),
    property: z.string(),
  }, async (params) => {
    const result = await godot.sendRequest("node/get_property", params);
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

  server.tool("godot_set_node_property", "Set a specific property of a node", {
    path: z.string(),
    property: z.string(),
    value: z.unknown(),
  }, async (params) => {
    const result = await godot.sendRequest("node/set_property", params);
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

  server.tool("godot_set_node_properties", "Set multiple properties of a node at once", {
    path: z.string(),
    properties: z.record(z.unknown()),
  }, async (params) => {
    const result = await godot.sendRequest("node/set_properties", params);
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

  server.tool("godot_move_node", "Move a node to a new parent", {
    path: z.string(),
    new_parent_path: z.string(),
    new_index: z.number().optional(),
  }, async (params) => {
    const result = await godot.sendRequest("node/move", params);
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

  server.tool("godot_get_node_children", "Get children of a node", {
    path: z.string(),
    recursive: z.boolean().optional(),
  }, async (params) => {
    const result = await godot.sendRequest("node/get_children", params);
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

  server.tool("godot_call_node_method", "Call a method on a node", {
    path: z.string(),
    method: z.string(),
    arguments: z.array(z.unknown()).optional(),
  }, async (params) => {
    const result = await godot.sendRequest("node/call_method", params);
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
