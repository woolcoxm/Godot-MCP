## 2024-05-29 - O(N) Array Reduction in TypeScript

**Learning:** When generating multiple counts from an array in TypeScript (e.g., getting counts of `errors`, `warnings`, and `info` issues), using multiple `.filter().length` calls iterates over the entire array multiple times and triggers unnecessary array allocations and garbage collection. This is an O(K * N) operation that can become a bottleneck when N is large (e.g., analyzing a large Godot script).

**Action:** Consolidate these checks into a single `.reduce()` pass. This converts the operation to O(N), reduces memory overhead by updating a single accumulator object, and makes the code cleaner. Always look for consecutive `.filter()` calls on the same array as an opportunity for this pattern.
