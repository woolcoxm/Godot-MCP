## 2024-05-24 - Editor Plugin Feedback Dialogs
**Learning:** Godot editor plugins should use UI dialogs (like AcceptDialog) for user-triggered status commands because console output might be hidden. Dialogs created dynamically must be added to the editor's base control and their signals connected to queue_free() to avoid memory leaks.
**Action:** Always implement visible dialogs with proper cleanup for user-facing commands in EditorPlugin.
