# Godot MCP Server - Comprehensive Workflow

## Phase 1: Foundation (Core Infrastructure) — ~20 tasks ✅ COMPLETED

- [x] **1. Initialize project** — `npm init`, install `@modelcontextprotocol/sdk`, `typescript`, `vitest`, `zod`, set up `tsconfig.json`, `vitest.config.ts`
- [x] **2. Create `src/config.ts`** — Environment config (GODOT_PATH, ports, timeouts, log level)
- [x] **3. Create `src/utils/logger.ts`** — stderr-only logger (no stdout pollution for MCP)
- [x] **4. Create `src/types/godot.ts`** — TypeScript types for all Godot types (Vector2/3, Color, Transform2D/3D, Rect2, Basis, Quat, etc.)
- [x] **5. Create `src/utils/godot-types.ts`** — Bidirectional converters (TS ↔ Godot type representations)
- [x] **6. Create `src/server.ts`** — McpServer setup with server instructions guiding LLM to use discovery tools first
- [x] **7. Create `src/index.ts`** — Entry point, stdio transport, wire up server
- [x] **8. Create `src/tools/categories.ts`** — Category definitions (14 categories from plan)
- [x] **9. Create `src/tools/registry.ts`** — Category-based tool registry with pagination, `godot_list_categories`, `godot_list_tools`, `godot_search_tools`
- [x] **10. Create `src/transports/headless-bridge.ts`** — Spawn `godot --headless --script`, reentrancy guard with queue, JSON stdin/stdout protocol
- [x] **11. Create `src/godot/headless/godot_operations.gd`** — GDScript dispatcher: read op name + JSON args from CLI, execute, print JSON result
- [x] **12. Implement headless ops: project config** — `create_project`, `read_project_settings`, `modify_project_settings`, `set_main_scene` in GDScript
- [x] **13. Implement headless ops: file I/O** — `read_file`, `write_file`, `list_directory`, `delete_file` in GDScript
- [x] **14. Wire up project management tools** — `src/tools/project/create-project.ts`, `project-settings.ts`, `input-map.ts`, `export-presets.ts`
- [x] **15. Create `src/utils/scene-parser.ts`** — `.tscn` and `.tres` file parser (read structured data from Godot's text formats)
- [x] **16. Create `src/utils/script-generator.ts`** — GDScript code generation helpers (indent management, class generation, signal/export annotations)
- [x] **17. Write Phase 1 tests** — Config, logger, registry, headless bridge, godot-types, scene-parser
- [ ] **18. Create test fixtures** — `tests/fixtures/test_project/` with a minimal Godot project
- [x] **19. Set up `.gitignore`**, basic `README.md`
- [x] **20. Smoke test** — Verify MCP server starts, responds to `list_categories`, headless bridge spawns

---

## Phase 2: Scene & Script Management — ~30 tasks

- [x] **21. Scene CRUD: `create-scene.ts`** — Create new `.tscn` with root node type, register with headless bridge
- [x] **22. Scene CRUD: `read-scene.ts`** — Parse `.tscn` into structured node tree
- [x] **23. Scene CRUD: `modify-scene.ts`** — Batch node modifications to a scene file
- [x] **24. Scene CRUD: `save-scene.ts`** — Serialize scene back to `.tscn` format
- [x] **25. Scene CRUD: `scene-tree.ts`** — Get scene tree as hierarchical JSON
- [ ] **26. Node ops: `create-node.ts`** — Add child node with type, name, initial properties
- [ ] **27. Node ops: `modify-node.ts`** — Modify node properties, metadata
- [ ] **28. Node ops: `delete-node.ts`** — Remove node and children from scene
- [ ] **29. Node ops: `properties.ts`** — Get/set individual properties with type validation
- [ ] **30. Node ops: `signals.ts`** — Add/remove connections between nodes
- [ ] **31. Node ops: `groups.ts`** — Add/remove nodes to/from groups
- [ ] **32. Additional node ops** — Reparent, find, children, move order, duplicate
- [ ] **33. GDScript tools: `create-script.ts`** — Create `.gd` files with class_name, extends, boilerplate
- [ ] **34. GDScript tools: `read-script.ts`** — Parse `.gd` into structured representation (functions, variables, signals, exports)
- [ ] **35. GDScript tools: `modify-script.ts`** — Add/remove functions, variables, signals, annotations
- [ ] **36. GDScript tools: `analyze-script.ts`** — Static analysis (unused vars, missing _ready, signal connections)
- [ ] **37. GDScript tools: `attach-script.ts`** — Attach/detach scripts from nodes
- [ ] **38. Asset pipeline: `import-asset.ts`** — Copy assets into project, configure `.import`
- [ ] **39. Asset pipeline: `create-material.ts`** — Generate `.tres` material files (StandardMaterial3D, ShaderMaterial)
- [ ] **40. Asset pipeline: `create-shader.ts`** — Generate `.gdshader` files with shader params
- [ ] **41. Asset pipeline: `create-texture.ts`** — Placeholder texture generation (GradientTexture, NoiseTexture, etc.)
- [ ] **42. Asset pipeline: `procedural-mesh.ts`** — Generate mesh resources (ArrayMesh, QuadMesh, etc.)
- [ ] **43. Implement remaining project tools** — Input map, autoloads, plugins, translations
- [ ] **44. Scene parser: full `.tscn` serialization** — Handle [ext_resource], [sub_resource], [node] sections, connections
- [ ] **45. Scene parser: `.tres` resource files** — Parse/serialize resource files
- [ ] **46. Transaction-like scene batching** — Accumulate node changes, apply atomically
- [ ] **47. Idempotency checks** — Duplicate name detection, existing resource checks
- [ ] **48. Error handling** — Descriptive error codes, recovery suggestions
- [ ] **49. Write Phase 2 tests** — Scene CRUD, node ops, script tools, asset pipeline, scene parser
- [ ] **50. Integration test** — Full flow: create project → create scene → add nodes → attach scripts → save

---

## Phase 3: World Building — ~35 tasks

- [ ] **51. 3D: `csg-ops.ts`** — CSGBox, CSGSphere, CSGCylinder, CSGTorus, CSGPolygon, boolean operations
- [ ] **52. 3D: `mesh-instance.ts`** — Create MeshInstance3D with primitive shapes, custom meshes, LOD
- [ ] **53. 3D: `lighting.ts`** — DirectionalLight3D, OmniLight3D, SpotLight3D, light properties
- [ ] **54. 3D: `environment.ts`** — WorldEnvironment, Environment resource, sky, fog, tonemapping
- [ ] **55. 3D: `navigation.ts`** — NavigationRegion3D, NavMesh, navigation mesh baking
- [ ] **56. 3D: `physics3d.ts`** — StaticBody3D, RigidBody3D, CharacterBody3D, collision shapes, raycasting config
- [ ] **57. 3D: `camera3d.ts`** — Camera3D, properties, current camera, layers
- [ ] **58. 3D: `skeleton.ts`** — Skeleton3D, bone setup, skin attachments
- [ ] **59. 3D: GI tools** — VoxelGI, SDFGI configuration
- [ ] **60. 3D: GridMap tools** — GridMap with mesh library
- [ ] **61. 3D: MultiMesh tools** — MultiMeshInstance3D for instancing
- [ ] **62. 3D: Path3D tools** — Path3D, curve editing
- [ ] **63. 3D: Particles3D** — GPUParticles3D configuration
- [ ] **64. 3D: Reflection probes** — ReflectionProbe, probe configuration
- [ ] **65. 3D: Viewport tools** — SubViewport, ViewportTexture
- [ ] **66. 2D: `tilemap.ts`** — TileMap with TileSet, tile layers, patterns
- [ ] **67. 2D: `sprite2d.ts`** — Sprite2D, AnimatedSprite2D, texture regions
- [ ] **68. 2D: `physics2d.ts`** — StaticBody2D, RigidBody2D, CharacterBody2D, collision shapes
- [ ] **69. 2D: `parallax.ts`** — ParallaxLayer, ParallaxBackground, mirroring
- [ ] **70. 2D: `canvas.ts`** — CanvasLayer, layer ordering, custom drawing
- [ ] **71. 2D: Light2D tools** — Light2D, shadows, blend mode
- [ ] **72. 2D: Path2D tools** — Path2D, curve editing
- [ ] **73. 2D: Polygon tools** — Polygon2D, collision polygon
- [ ] **74. 2D: Skeleton2D** — Skeleton2D, bone setup
- [ ] **75. 2D: Particles2D** — GPUParticles2D
- [ ] **76. 2D: TileSet editor** — TileSet resource creation
- [ ] **77. 2D: Navigation2D** — NavigationRegion2D
- [ ] **78. Animation: `animation-player.ts`** — AnimationPlayer, create animations, tracks, keyframes
- [ ] **79. Animation: `animation-tree.ts`** — AnimationTree, state machine, blend trees
- [ ] **80. Animation: `tweening.ts`** — Tween configuration, easing functions
- [ ] **81. Animation: `skeleton-ik.ts`** — SkeletonIK3D configuration
- [ ] **82. Animation: Blend spaces** — BlendSpace2D, BlendSpace1D
- [ ] **83. Animation: Procedural animation** — Procedural track helpers
- [ ] **84. Write Phase 3 tests** — All 3D, 2D, and animation tools
- [ ] **85. Integration test** — Build a small 3D level and a 2D level programmatically

---

## Phase 4: Editor Plugin & Runtime Control — ~25 tasks

- [ ] **86. Editor plugin: `plugin.cfg`** — Plugin metadata
- [ ] **87. Editor plugin: `plugin.gd`** — Plugin entry point, enable/disable lifecycle
- [ ] **88. Editor plugin: `mcp_server.gd`** — WebSocket server on :13337, JSON message protocol
- [ ] **89. Editor plugin: `scene_ops.gd`** — Live scene tree queries, node inspection
- [ ] **90. Editor plugin: `node_ops.gd`** — Live node creation/modification/deletion
- [ ] **91. Editor plugin: `script_ops.gd`** — Live script editing in editor
- [ ] **92. Editor plugin: `editor_ops.gd`** — Editor state, selection, current scene
- [ ] **93. TypeScript: `editor-bridge.ts`** — WebSocket client to :13337, reconnection, message queue
- [ ] **94. Runtime: `mcp_autoload.gd`** — Autoload script, WebSocket server on :13338
- [ ] **95. Runtime: `runtime_ops.gd`** — Runtime operations dispatcher
- [ ] **96. TypeScript: `runtime-bridge.ts`** — WebSocket client to :13338, reconnection
- [ ] **97. Runtime tools: `eval.ts`** — `game_eval` with timeout, return value capture
- [ ] **98. Runtime tools: `input-simulation.ts`** — Keyboard, mouse, gamepad, touch simulation
- [ ] **99. Runtime tools: `screenshot.ts`** — Capture and return screenshots as base64
- [ ] **100. Runtime tools: `debug.ts`** — Breakpoint simulation, stack trace, variable inspection
- [ ] **101. Runtime tools: `state.ts`** — Game state queries, autoload access, singleton inspection
- [ ] **102. Runtime tools: Performance** — FPS, frame time, memory, object count
- [ ] **103. Runtime tools: Pause/timescale** — Pause, resume, timescale control
- [ ] **104. Runtime tools: Window/OS** — Window title, size, fullscreen, OS info
- [ ] **105. Editor tools: `launch-editor.ts`** — Launch Godot editor with project
- [ ] **106. Editor tools: `run-project.ts`** — Run project from editor, stop
- [ ] **107. Editor tools: `editor-state.ts`** — Query editor state, selection, open scenes
- [ ] **108. Editor tools: `filesystem.ts`** — Editor filesystem operations, scan
- [ ] **109. Graceful degradation** — Headless fallback when editor/runtime unavailable
- [ ] **110. Write Phase 4 tests** — Mock WebSocket tests for editor and runtime bridges

---

## Phase 5: Advanced Systems — ~25 tasks

- [ ] **111. UI: `controls.ts`** — Button, Label, LineEdit, TextEdit, CheckBox, etc.
- [ ] **112. UI: `theme.ts`** — Theme creation, font/color/style overrides
- [ ] **113. UI: `layout.ts`** — VBoxContainer, HBoxContainer, GridContainer, MarginContainer, Anchor presets
- [ ] **114. UI: `popup.ts`** — Popup, PopupMenu, ConfirmationDialog, FileDialog
- [ ] **115. UI: Tree/ItemList controls** — Tree, ItemList with items
- [ ] **116. UI: Tab/Menu controls** — TabContainer, TabBar, MenuBar, PopupMenu
- [ ] **117. UI: Text/Range controls** — RichTextLabel, HSlider, VSlider, ProgressBar, SpinBox
- [ ] **118. UI: Graph/Custom** — GraphEdit, GraphNode
- [ ] **119. Audio: `playback.ts`** — AudioStreamPlayer, AudioStreamPlayer2D, AudioStreamPlayer3D
- [ ] **120. Audio: `buses.ts`** — Audio bus layout, bus creation, routing
- [ ] **121. Audio: `effects.ts`** — Audio effect resources (reverb, EQ, compressor, etc.)
- [ ] **122. Audio: Spatial/stream/capture** — Spatial audio config, stream setup, capture
- [ ] **123. Networking: `http.ts`** — HTTPRequest node configuration
- [ ] **124. Networking: `websocket.ts`** — WebSocketPeer configuration
- [ ] **125. Networking: `multiplayer.ts`** — MultiplayerSpawner, MultiplayerSynchronizer, SceneMultiplayer
- [ ] **126. Networking: RPC/Packet** — RPC configuration, raw packet tools
- [ ] **127. Build: `export-project.ts`** — Export project for platform (Windows, Mac, Linux, Web, Mobile)
- [ ] **128. Build: `manage-presets.ts`** — Create/modify export presets, checksum, deploy
- [ ] **129. MCP Resources: `script-resource.ts`** — `godot://script/{path}` resource handler
- [ ] **130. MCP Resources: `scene-resource.ts`** — `godot://scene/{path}` resource handler
- [ ] **131. MCP Resources: `project-resource.ts`** — `godot://project/info` resource handler
- [ ] **132. MCP Resources: `docs-resource.ts`** — `godot://docs/{class}` resource handler (scraped/inline docs)
- [ ] **133. Write Phase 5 tests** — UI, audio, networking, build, resources
- [ ] **134. Integration test** — Full game creation: project → scene → 3D world → UI → export config

---

## Phase 6: Polish & Hardening — ~15 tasks

- [ ] **135. Connection pooling** — Reuse headless Godot processes, WebSocket connection management
- [ ] **136. Caching** — Cache parsed scenes, project state, reduce redundant file reads
- [ ] **137. Comprehensive error recovery** — Retry logic, fallback strategies, cleanup on crash
- [ ] **138. Type safety audit** — Ensure all 149+ Godot types have bidirectional converters
- [ ] **139. Tool annotations audit** — Verify `readOnlyHint`, `destructiveHint`, `idempotentHint` on all tools
- [ ] **140. Write remaining tests** — Target 400+ total tests across all modules
- [ ] **141. Example configs** — `opencode.json`, Claude Desktop config, Cursor config
- [ ] **142. Documentation: `README.md`** — Setup, usage, architecture, tool reference
- [ ] **143. Documentation: Contributing guide** — How to add tools, extend categories
- [ ] **144. Performance profiling** — Benchmark headless bridge latency, WebSocket throughput
- [ ] **145. CI/CD pipeline** — GitHub Actions for lint, typecheck, test, build
- [ ] **146. Final integration test** — End-to-end: "create a complete game from scratch" via MCP
- [ ] **147. Edge case testing** — Unicode filenames, large scenes, concurrent requests, malformed data
- [ ] **148. Security review** — Safe eval sandboxing, path traversal prevention, input validation
- [ ] **149. Release prep** — npm packaging, versioning, changelog

---

**Total: 149 tasks across 6 phases.**

**Progress Tracking:**
- Phase 1: 17/20 (85%) ✅
- Phase 2: 0/30 (0%)
- Phase 3: 0/35 (0%)
- Phase 4: 0/25 (0%)
- Phase 5: 0/25 (0%)
- Phase 6: 0/15 (0%)
- **Overall: 17/149 (11%)**

**Notes:**
- Checkboxes are placed beside each task
- As tasks are completed, mark the checkbox with an `[x]`
- Each phase builds on the previous
- Tests and integration verification should be completed before moving to next phase
- Estimated effort: significant multi-week project