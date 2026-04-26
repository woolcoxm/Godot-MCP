## 2024-04-26 - [ToolRegistry Optimization]
**Learning:** O(N) array filtering in `ToolRegistry` was significantly slowing down tool lookups (`getToolsByCategory`, `godot_list_tools`).
**Action:** Implementing an O(1) `Map<string, RegisteredTool[]>` for `toolsByCategory` reduced lookup times from ~19ms to ~0.24ms. Ensure any dynamic mapping caches are properly documented with comments to comply with strict instructions.
