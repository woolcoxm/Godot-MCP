## 2024-05-12 - Prevent Command Injection via Validating projectPath
**Vulnerability:** In `godot_launch_editor` and `godot_run_project` tools, user-provided `projectPath` args could start with a hyphen (`-`) and be treated as Godot command flags (e.g. `--script`) instead of a path, leading to local execution of arbitrary scripts or flags when `spawn()` is called.
**Learning:** Even though `spawn()` is relatively safe from shell injection (since shell: false is the default), passing a raw string like `-s=my_evil_script.gd` as a positional argument will be interpreted as a flag by the executable (`godot`).
**Prevention:** Verify that any dynamically constructed positional arguments that act as paths or values do not begin with a hyphen.
