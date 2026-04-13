## 2024-05-24 - [CRITICAL] Prevent Path Traversal in script_ops.gd
**Vulnerability:** Path traversal vulnerability in `script_ops.gd` endpoints `read_script` and `write_script`, allowing an attacker to bypass `res://` restrictions to read or write arbitrary system files.
**Learning:** File operations accepting paths directly from parameters MUST validate that the path is strictly within the project boundary using a custom path normalization/safety check (e.g. `_is_path_safe`) because `FileAccess.open` will gladly open any valid system path the Godot headless instance has permissions for.
**Prevention:** Centralize path validation in a shared method and require all incoming file paths to pass through it before being fed into Godot's file I/O operations (`FileAccess`, `DirAccess`).
