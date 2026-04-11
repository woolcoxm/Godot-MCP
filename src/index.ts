import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GodotConnection } from "./godot-connection.js";
import { registerProjectTools } from "./tools/project.js";
import { registerSceneTools } from "./tools/scene.js";
import { registerNodeTools } from "./tools/node.js";
import { registerMeshTools } from "./tools/mesh.js";
import { registerSkeletonTools } from "./tools/skeleton.js";
import { registerAnimationTools } from "./tools/animation.js";
import { registerMaterialTools } from "./tools/material.js";
import { registerPhysicsTools } from "./tools/physics.js";
import { registerLightingTools } from "./tools/lighting.js";
import { registerCameraTools } from "./tools/camera.js";
import { registerScriptTools } from "./tools/script.js";
import { registerInputTools } from "./tools/input.js";
import { registerResourceTools } from "./tools/resource.js";
import { registerAudioTools } from "./tools/audio.js";
import { registerUiTools } from "./tools/ui.js";
import { registerEditorTools } from "./tools/editor.js";
import { registerParticleTools } from "./tools/particles.js";
import { registerNavigationTools } from "./tools/navigation.js";

export function createMcpServer(godot: GodotConnection): McpServer {
  const server = new McpServer({
    name: "godot-mcp",
    version: "1.0.0",
  });

  registerProjectTools(server, godot);
  registerSceneTools(server, godot);
  registerNodeTools(server, godot);
  registerMeshTools(server, godot);
  registerSkeletonTools(server, godot);
  registerAnimationTools(server, godot);
  registerMaterialTools(server, godot);
  registerPhysicsTools(server, godot);
  registerLightingTools(server, godot);
  registerCameraTools(server, godot);
  registerScriptTools(server, godot);
  registerInputTools(server, godot);
  registerResourceTools(server, godot);
  registerAudioTools(server, godot);
  registerUiTools(server, godot);
  registerEditorTools(server, godot);
  registerParticleTools(server, godot);
  registerNavigationTools(server, godot);

  return server;
}

export async function main(): Promise<void> {
  const godot = new GodotConnection();

  godot.onStateChange = (state) => {
    process.stderr.write(`[godot-mcp] Connection state: ${state}\n`);
  };

  process.stderr.write("[godot-mcp] Starting server...\n");
  process.stderr.write("[godot-mcp] Attempting to connect to Godot at ws://127.0.0.1:9900...\n");

  try {
    await godot.connect();
    process.stderr.write("[godot-mcp] Connected to Godot editor.\n");
  } catch {
    process.stderr.write("[godot-mcp] Could not connect to Godot. Will retry in background.\n");
    process.stderr.write("[godot-mcp] Make sure Godot editor is running with the godot_mcp plugin enabled.\n");
  }

  const server = createMcpServer(godot);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`[godot-mcp] Fatal error: ${error}\n`);
  process.exit(1);
});
