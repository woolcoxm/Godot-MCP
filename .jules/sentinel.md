## 2024-05-24 - [Path Traversal Fix]
**Vulnerability:** Found missing path validation in file accessing components (e.g. `godot_plugin/addons/godot_mcp/script_ops.gd`).
**Learning:** File paths passed to MCP server aren't validated to stay within `res://` allowing path traversal attacks via `..` or absolute paths.
**Prevention:** Always implement a validation function `_is_path_safe` and call it before reading or writing files in the plugin operations.
