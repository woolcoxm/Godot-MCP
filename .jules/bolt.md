## 2026-04-24 - [ToolRegistry Optimization]
**Learning:** When optimizing reads by introducing cache/index structures like `Map`s, overwriting an existing entry in the source map must be handled properly in the cache/index map to prevent data duplication/staleness (especially when the grouping attribute like category changes).
**Action:** When adding indices to `Map`s or `Array`s, always check for update cases in insertion functions and ensure the old version is cleanly removed/updated before the new version is added.
