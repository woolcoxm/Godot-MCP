## 2024-05-07 - Command Injection via Spawn
**Vulnerability:** The 'spawn' command in launch-editor.ts and run-project.ts passes unsanitized user inputs (editorPath, projectPath, args) directly to the OS.
**Learning:** Even when using array-based argument passing in child_process.spawn, user inputs can inject flags (like --script) or act as malicious executables, bypassing intended restrictions.
**Prevention:** Validate executables to ensure they match expected binary names (e.g., starting with 'godot'), ensure paths do not start with hyphens to prevent flag injection, and explicitly reject known dangerous flags in user arguments.
