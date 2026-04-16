
## 2026-04-16 - Plugin Status Needs UI Dialog
**Learning:** Printing plugin status messages to the console is insufficient for Godot editor tools, as the console panel might be hidden by the user. Commands triggered by the user via editor menus (like "Show Status") must present their output visually through UI elements like AcceptDialog to be effectively noticed.
**Action:** Always prefer Editor UI dialogs over simple `print()` statements for plugin commands that require explicit user awareness or confirmation in the Godot Editor.
