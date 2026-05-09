## 2026-05-09 - [Status Dialog UX Improvement]
**Learning:** For Godot editor plugins, status messages printed to the console are often missed by users because the output panel might be hidden or cluttered. Using an explicit UI dialog like `AcceptDialog` provides much clearer and immediate feedback for user-triggered status checks.
**Action:** Always use explicit UI elements (like AcceptDialog) instead of just console prints for status commands triggered directly by the user from menus, ensuring the dialog is properly cleaned up with `queue_free()`.
