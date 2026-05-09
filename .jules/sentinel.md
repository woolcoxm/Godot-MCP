## 2024-05-09 - Prevent Command Injection in Editor Launch
**Vulnerability:** Command injection and unauthorized execution via unsanitized user inputs in `launch-editor` and `run-project` tools (`projectPath`, `editorPath`, `args`).
**Learning:** Tools relying on `child_process.spawn` must validate executable paths and meticulously sanitize flags (especially `--script` or `--headless`) to prevent unintended execution or RCE, even if they aren't explicitly passed to a shell.
**Prevention:** Use a dedicated security utility (`isPathSafe`, `isValidExecutable`, `sanitizeUserArguments`) to filter and block paths containing flag prefixes (e.g., `-`) and strictly allow-list acceptable executables (like those starting with `godot`) before launching external processes.
