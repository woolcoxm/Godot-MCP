## 2024-05-15 - Use UI Dialogs for Editor Plugin Output
**Learning:** For user-triggered status commands in Godot plugins, outputting to the console via `print()` is poor UX because the console panel is often hidden.
**Action:** Use UI dialogs (like `AcceptDialog`) to show output directly in the editor viewport.
