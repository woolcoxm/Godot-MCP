## 2024-05-14 - Godot Editor Plugin Status Output
**Learning:** Printing output to the console for user-triggered commands in Godot provides poor feedback, as the Output panel is often hidden from view.
**Action:** When creating Godot editor plugin menu items that report status or information, use UI dialogs (like `AcceptDialog`) to display the feedback clearly and persistently to the user.
