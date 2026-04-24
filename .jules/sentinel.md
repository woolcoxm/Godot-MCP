## YYYY-MM-DD - Command Injection Risk in Process Spawning
**Vulnerability:** Tools in `src/tools/editor/launch-editor.ts` and `src/tools/editor/run-project.ts` launch arbitrary executables passed as arguments without proper validation against malicious binaries.
**Learning:** We need to restrict what executables can be run to prevent RCE.
**Prevention:** Implement and enforce a `isValidExecutable` function to check user-supplied executable paths before passing them to `spawn`.
