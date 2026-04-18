## 2024-04-18 - ToolRegistry Category Lookup Optimization
**Learning:** ToolRegistry `getToolsByCategory` and category listing inside `godot_list_tools` was using O(N) Array.from(this.tools.values()).filter(...) which iterated all tools on every request.
**Action:** Introduced a `toolsByCategory` Map to cache tools by category, changing lookup complexity to O(1).
