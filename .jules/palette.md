## 2024-05-24 - User-Triggered Actions in Godot Editor Plugins
**Learning:** In Godot Editor plugins, relying on `print()` for user-triggered actions (like showing status or confirming server restarts) results in poor UX because the output console is often hidden or cluttered. Users have no clear feedback that their action was successful.
**Action:** Always use UI dialogs, specifically `AcceptDialog`, to present feedback for explicit user-triggered actions. This ensures the user receives clear, unmissable confirmation of their action.
