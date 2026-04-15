## 2026-04-15 - Plugin Status Visibility
**Learning:** Using terminal/console prints for status actions in editor plugins leads to poor UX because the console output panel is often hidden from the user.
**Action:** Always use UI dialogs (like `AcceptDialog` in Godot) for user-triggered status commands instead of just console prints.
