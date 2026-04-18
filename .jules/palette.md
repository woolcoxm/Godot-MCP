## 2024-05-14 - Use UI Dialogs for Godot Editor Plugin Status
**Learning:** Console prints (`print()`) are often missed by users in Godot plugins because the output panel may be hidden. This leads to a poor user experience when triggering status or confirmation commands via the Editor menu.
**Action:** Use UI dialogs (like `AcceptDialog`) instead of console prints for user-triggered status commands in Godot plugins. This ensures the user receives visible, immediate feedback.
