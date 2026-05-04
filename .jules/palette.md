## 2026-05-04 - Godot Editor UI Feedback
**Learning:** In Godot Editor plugins, relying purely on console prints for user-triggered commands (like showing plugin status) is poor UX because the output console might be hidden or closed, leaving the user without feedback.
**Action:** Always use Godot's UI dialogs (like `AcceptDialog`) to show explicit feedback to the user, ensuring the dialog is styled correctly by adding it to `get_editor_interface().get_base_control()`, and connecting `confirmed`/`canceled` signals to `queue_free` to prevent memory leaks.
