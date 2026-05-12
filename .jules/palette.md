## 2024-05-12 - [Godot Editor UI Status Dialog]
**Learning:** The Godot editor plugin outputs commands to the console by default, which is easily missed. Adding UI dialogs natively via the `get_editor_interface().get_base_control()` significantly improves visibility.
**Action:** When working on Godot Editor Plugin UX, use native Godot UI dialogs (like `AcceptDialog`) to convey system status, remembering to connect `canceled` and `confirmed` signals to `queue_free()` to prevent memory leaks in Godot 4.
