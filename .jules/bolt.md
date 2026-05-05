
## 2024-05-05 - O(1) ToolRegistry category index
**Learning:** In highly queried registry classes, read-heavy operations like filtering items by category can be optimized from O(N) array filtering to O(1) Map lookups by maintaining an index. Memory warned to properly manage updates, and checking `has` before updating arrays is vital for performance indexing.
**Action:** Always consider `Map` indices for repeated filtering operations, especially when initializing server components that get queried frequently.
