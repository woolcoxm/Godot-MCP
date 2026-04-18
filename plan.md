You want everything — the full kitchen sink. That's the right call for a "make a game from nothing" MCP server. Here's my comprehensive plan:
---
Godot MCP Server — Implementation Plan
Architecture
opencode / AI Client
       │
       │  MCP (stdio)
       ▼
┌──────────────────────────────┐
│  TypeScript MCP Server       │
│  @modelcontextprotocol/sdk   │
│                              │
│  ├── Tool Router             │
│  │   ├── Category Registry   │
│  │   └── Pagination Engine   │
│  │                           │
│  ├── Headless Bridge         │──── godot --headless --script
│  │   (project creation,      │     (no editor needed)
│  │    file I/O, scenes,      │
│  │    project config)        │
│  │                           │
│  ├── Editor Plugin Bridge    │──── WebSocket :13337
│  │   (live scene tree,       │     (when editor is open)
│  │    script editing,        │
│  │    editor state)          │
│  │                           │
│  └── Runtime Bridge          │──── WebSocket :13338
│      (running game control,  │     (autoload in game)
│       eval, input, debug)    │
└──────────────────────────────┘
Three communication channels, one MCP server:
1. Headless CLI — For project scaffolding, file operations, scene creation. No editor required.
2. Editor Plugin (WebSocket :13337) — For live editor interaction when the Godot editor is running.
3. Runtime Autoload (WebSocket :13338) — For controlling a running game (eval code, input simulation, screenshots).
Project Structure
godot-mcp/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts                          # Entry point, MCP server setup
│   ├── server.ts                         # McpServer configuration
│   ├── config.ts                         # Environment config (GODOT_PATH, etc.)
│   ├── transports/
│   │   ├── headless-bridge.ts            # Spawns godot --headless --script
│   │   ├── editor-bridge.ts              # WebSocket to editor plugin
│   │   └── runtime-bridge.ts             # WebSocket to game autoload
│   ├── tools/
│   │   ├── registry.ts                   # Category-based tool registry
│   │   ├── categories.ts                 # Category definitions
│   │   ├── project/                      # Project creation & management
│   │   │   ├── create-project.ts
│   │   │   ├── project-settings.ts
│   │   │   ├── export-presets.ts
│   │   │   └── input-map.ts
│   │   ├── scene/                        # Scene CRUD
│   │   │   ├── create-scene.ts
│   │   │   ├── read-scene.ts
│   │   │   ├── modify-scene.ts
│   │   │   ├── save-scene.ts
│   │   │   └── scene-tree.ts
│   │   ├── node/                         # Node operations
│   │   │   ├── create-node.ts
│   │   │   ├── modify-node.ts
│   │   │   ├── delete-node.ts
│   │   │   ├── properties.ts
│   │   │   ├── signals.ts
│   │   │   └── groups.ts
│   │   ├── script/                       # GDScript management
│   │   │   ├── create-script.ts
│   │   │   ├── read-script.ts
│   │   │   ├── modify-script.ts
│   │   │   ├── analyze-script.ts
│   │   │   └── attach-script.ts
│   │   ├── assets/                       # Asset pipeline
│   │   │   ├── import-asset.ts
│   │   │   ├── create-material.ts
│   │   │   ├── create-shader.ts
│   │   │   ├── create-texture.ts
│   │   │   └── procedural-mesh.ts
│   │   ├── world3d/                      # 3D world building
│   │   │   ├── csg-ops.ts
│   │   │   ├── mesh-instance.ts
│   │   │   ├── lighting.ts
│   │   │   ├── environment.ts
│   │   │   ├── navigation.ts
│   │   │   ├── physics3d.ts
│   │   │   ├── camera3d.ts
│   │   │   └── skeleton.ts
│   │   ├── world2d/                      # 2D world building
│   │   │   ├── tilemap.ts
│   │   │   ├── sprite2d.ts
│   │   │   ├── physics2d.ts
│   │   │   ├── parallax.ts
│   │   │   └── canvas.ts
│   │   ├── animation/                    # Animation system
│   │   │   ├── animation-player.ts
│   │   │   ├── animation-tree.ts
│   │   │   ├── tweening.ts
│   │   │   └── skeleton-ik.ts
│   │   ├── ui/                           # UI system
│   │   │   ├── controls.ts
│   │   │   ├── theme.ts
│   │   │   ├── layout.ts
│   │   │   └── popup.ts
│   │   ├── audio/                        # Audio system
│   │   │   ├── playback.ts
│   │   │   ├── buses.ts
│   │   │   └── effects.ts
│   │   ├── networking/                   # Networking
│   │   │   ├── http.ts
│   │   │   ├── websocket.ts
│   │   │   └── multiplayer.ts
│   │   ├── runtime/                      # Runtime game control
│   │   │   ├── eval.ts
│   │   │   ├── input-simulation.ts
│   │   │   ├── screenshot.ts
│   │   │   ├── debug.ts
│   │   │   └── state.ts
│   │   ├── editor/                       # Editor control
│   │   │   ├── launch-editor.ts
│   │   │   ├── run-project.ts
│   │   │   ├── editor-state.ts
│   │   │   └── filesystem.ts
│   │   └── build/                        # Build & export
│   │       ├── export-project.ts
│   │       └── manage-presets.ts
│   ├── resources/                        # MCP resources
│   │   ├── script-resource.ts            # godot://script/{path}
│   │   ├── scene-resource.ts             # godot://scene/{path}
│   │   ├── project-resource.ts           # godot://project/info
│   │   └── docs-resource.ts              # godot://docs/{class}
│   ├── godot/
│   │   ├── headless/
│   │   │   └── godot_operations.gd       # Headless GDScript operations
│   │   ├── editor-plugin/
│   │   │   ├── plugin.cfg                # Editor plugin config
│   │   │   ├── plugin.gd                 # Editor plugin entry
│   │   │   ├── mcp_server.gd             # WebSocket server for editor
│   │   │   └── operations/
│   │   │       ├── scene_ops.gd
│   │   │       ├── node_ops.gd
│   │   │       ├── script_ops.gd
│   │   │       └── editor_ops.gd
│   │   └── runtime/
│   │       ├── mcp_autoload.gd           # Runtime autoload script
│   │       └── runtime_ops.gd            # Runtime operations
│   ├── utils/
│   │   ├── godot-types.ts               # Vector2/3, Color, Transform etc. converters
│   │   ├── scene-parser.ts              # .tscn file parser/serializer
│   │   ├── script-generator.ts          # GDScript code generation
│   │   └── logger.ts                    # stderr-only logger
│   └── types/
│       └── godot.ts                      # TypeScript types for Godot types
├── tests/
│   ├── tools/
│   │   ├── project.test.ts
│   │   ├── scene.test.ts
│   │   ├── node.test.ts
│   │   └── ...
│   ├── utils/
│   │   ├── scene-parser.test.ts
│   │   └── godot-types.test.ts
│   └── fixtures/
│       └── test_project/                 # Test Godot project
├── examples/
│   └── opencode.json                     # Example opencode config
└── README.md
Categorized Tool Registry (149+ tools across 14 categories)
Instead of registering all 149+ tools at once, the server uses a category-based discovery system:
1. godot_list_categories — Lists all tool categories (project, scene, node, script, etc.)
2. godot_list_tools — Lists tools within a category (paginated, 20 per page)
3. godot_search_tools — Search tools by keyword across all categories
4. All actual tools are registered but the LLM is guided via server instructions to use discovery first
Each tool includes annotations (readOnlyHint, destructiveHint, idempotentHint) to help the LLM use them safely.
Tool Categories & Tool Count
#	Category	Tools
1	Project Management	8 (create, settings, input map, autoloads, plugins, translations, main scene, presets)
2	Scene Management	8 (create, read, modify, save, tree, duplicate, inherit, merge)
3	Node Operations	12 (create, modify, delete, reparent, properties, signals, groups, find, children, move, duplicate)
4	GDScript	7 (create, read, modify, analyze, attach, detach, generate)
5	Asset Pipeline	10 (import, material, shader, texture, procedural mesh, resource, font, audio import, .import config, resource preview)
6	3D World Building	20 (CSG, mesh, light, env, sky, camera, GI, nav, physics3d, gridmap, multimesh, path3d, skeleton, particles3d, fog, reflection, viewport, bones, deformable)
7	2D World Building	12 (tilemap, sprite, physics2d, parallax, canvas, light2d, path2d, polygon, skeleton2d, particles2d, tileset, navigation2d)
8	Animation	8 (player, tree, tween, blend, skeleton IK, procedural, state machine, blend spaces)
9	UI System	12 (controls, theme, layout, popup, tree, item list, tabs, menu, text, range, graph, custom)
10	Audio	6 (play, bus, effects, spatial, stream, capture)
11	Networking	5 (http, websocket, multiplayer, rpc, packet)
12	Runtime Control	16 (eval, input, screenshot, debug, state, errors, logs, performance, pause, timescale, process mode, window, OS info, wait, groups, find nodes)
13	Editor Control	6 (launch, run, stop, state, filesystem, selection)
14	Build & Export	4 (export, presets, checksum, deploy)
	Total	~134 tools
GDScript Components
godot_operations.gd (Headless) — A single GDScript file that accepts operation name + JSON params via command line args, executes the operation, and prints JSON to stdout. Operations:
- Scene CRUD (create, read, modify, save .tscn files)
- Node manipulation within scenes
- Script creation/attachment
- Project configuration (project.godot, export_presets.cfg)
- Resource management
- File I/O
Editor Plugin — A Godot editor plugin (addons/godot_mcp/) that:
- Starts a WebSocket server on port 13337 when the editor opens
- Handles scene tree queries, node property inspection
- Provides editor state (current scene, selection, open scripts)
- Allows real-time node creation/modification in the editor
Runtime Autoload — A GDScript autoload (mcp_runtime.gd) that:
- Starts a WebSocket server on port 13338 when the game runs
- Provides eval() for arbitrary GDScript execution
- Handles input simulation (keyboard, mouse, gamepad, touch)
- Returns screenshots, performance data, error logs
- Allows property/method/signal inspection at runtime
Implementation Phases
Phase 1: Foundation (Core infrastructure)
- MCP server with stdio transport, config, logging
- Headless bridge (spawn godot --headless)
- Tool registry with category/pagination system
- godot_operations.gd with scene/node/project operations
- Basic tests
Phase 2: Scene & Script Management
- Scene CRUD tools (create, read, modify, save)
- Node operations (create, modify, delete, properties, signals)
- GDScript tools (create, read, modify, generate, analyze)
- .tscn/.tres file parser and serializer
- Asset pipeline basics (materials, shaders, textures)
Phase 3: World Building
- 3D tools (CSG, mesh, lighting, environment, physics, navigation, camera)
- 2D tools (tilemap, sprite, physics, parallax, canvas)
- Procedural mesh and material generation
- Animation system tools
Phase 4: Editor Plugin & Runtime
- Editor plugin with WebSocket server
- Runtime autoload with WebSocket server
- Editor bridge and runtime bridge in TypeScript
- Input simulation, screenshots, eval
- Live debugging tools
Phase 5: Advanced Systems
- UI system tools
- Audio system tools
- Networking/multiplayer tools
- Build & export pipeline
- Resource system (MCP resources for godot:// URIs)
- Documentation resources
Phase 6: Polish
- Comprehensive test suite (target 400+ tests)
- Error handling & recovery
- Type safety for all Godot types (Vector2/3, Color, Transform, etc.)
- Example configurations for opencode, Claude Desktop, Cursor
- Performance optimization (connection pooling, caching)
Key Design Decisions
1. Graceful degradation: If the editor isn't running, headless-only tools still work. If the game isn't running, runtime tools return a clear error suggesting to launch the game.
2. Reentrancy guard: Only one headless operation at a time (Godot's headless mode is single-process). Queue subsequent requests.
3. Godot type conversion: Full bidirectional conversion between TypeScript and Godot types (Vector2 ↔ {x, y}, Color ↔ {r, g, b, a}, Transform3D ↔ matrix, etc.)
4. Safe eval: Runtime game_eval has an optional timeout and sandboxing recommendations.
5. Idempotent operations: Scene/node creation tools check for existing names and return errors rather than creating duplicates.
6. Transaction-like scene modification: Multiple node changes can be batched and applied atomically to a .tscn file.
---
This is a substantial project (~150+ files, ~15k+ lines of TypeScript + GDScript). Shall I proceed with implementation? I'd recommend starting with Phase 1 (foundation) and Phase 2 (scene/script) since those enable the core "make a game from nothing" workflow.