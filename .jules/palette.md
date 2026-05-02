## 2024-05-02 - Godot AcceptDialog Memory Leak Prevention
**Learning:** In Godot 4 editor plugins, dynamically created UI dialogs like `AcceptDialog` do not automatically delete themselves when closed. If not handled, this causes memory leaks over time. Also, using `get_editor_interface().get_base_control().add_child()` is required to add them correctly to the UI.
**Action:** Always connect `confirmed` and `canceled` signals to `queue_free()` for dynamically spawned editor dialogs, and parent them to the editor base control.
