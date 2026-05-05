## 2025-05-05 - [Prevent Command Injection in Godot Spawn Calls]
**Vulnerability:** Untrusted user input (`validated.args`) was being directly concatenated and passed to `spawn(command, args)` in both `launch-editor.ts` and `run-project.ts`.
**Learning:** This is a classic Command Injection vulnerability because `spawn` parameters weren't adequately sanitized, potentially allowing attackers to execute arbitrary system commands by injecting Godot flags or shell escapes.
**Prevention:** Always use `isValidExecutable` to validate tool binaries via a strict allowlist. Run untrusted arguments through a restrictive sanitizer (like `sanitizeUserArguments` which blocks dangerous flags like `--export`, `--headless`, `--script`) before passing them to child processes.
