## 2024-04-16 - Path Traversal Vulnerability in Script Operations

**Vulnerability:** The `script_ops.gd` file lacked path validation, allowing potential path traversal attacks where arbitrary files could be read or written outside of the expected `res://` directory.
**Learning:** File paths passed to functions like `FileAccess.open` and `DirAccess.open` in Godot must be sanitized and validated.
**Prevention:** Implement an `_is_path_safe` validation function that checks if the path begins with `res://` and does not contain `..` after simplifying it, enforcing that file access is restricted to the Godot project directory.
