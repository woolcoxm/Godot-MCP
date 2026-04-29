## 2026-04-29 - [Single-pass Aggregation]
**Learning:** Found multiple instances where multiple `.filter().length` calls were iterating over the same arrays multiple times (e.g. O(3n) when counting different issue types).
**Action:** Used single-pass loops (like `reduce`) to aggregate counts in O(n) time, preventing unnecessary iterations.
