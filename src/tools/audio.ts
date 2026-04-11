import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GodotConnection } from "../godot-connection.js";

export function registerAudioTools(server: McpServer, godot: GodotConnection): void {
  server.tool(
    "godot_create_audio_player",
    "Create an audio player node",
    {
      parent_path: z.string(),
      player_type: z.enum(["player_2d", "player_3d", "stream"]).optional().describe("Audio player type. Defaults to 'player_2d'"),
      name: z.string().optional(),
    },
    async (params) => {
      const result = await godot.sendRequest("audio/create_player", params);
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
    "godot_play_audio",
    "Play audio through an AudioStreamPlayer node",
    {
      path: z.string().describe("AudioStreamPlayer node path"),
      audio_path: z.string().describe("Audio file path (res://...wav, res://...ogg, res://...mp3)"),
      volume_db: z.number().optional().describe("Volume in decibels"),
      pitch_scale: z.number().optional(),
      bus: z.string().optional().describe("Audio bus name"),
    },
    async (params) => {
      const result = await godot.sendRequest("audio/play", params);
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
    "godot_set_audio_properties",
    "Set properties on an audio player node",
    {
      path: z.string(),
      properties: z.record(z.unknown()).describe("Audio properties: volume_db, pitch_scale, bus, autoplay, max_polyphony, etc."),
    },
    async (params) => {
      const result = await godot.sendRequest("audio/set_properties", params);
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
