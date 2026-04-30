## 2025-05-01 - Optimizing ToolRegistry By Using an Index
**Learning:** The `ToolRegistry` iterates through all registered tools multiple times to filter them by category (e.g. `godot_list_tools` tool handler, `getToolsByCategory` method). As the number of tools grows, this `Array.from(this.tools.values()).filter(...)` becomes an O(N) operation on each call, which could be optimized using an index structure.
**Action:** Implemented a secondary map indexing tools by category (`toolsByCategory`) in `ToolRegistry` to turn O(N) filter operations into O(1) map lookups.
