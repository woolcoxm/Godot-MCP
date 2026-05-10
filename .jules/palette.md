## 2024-05-10 - AcceptDialog memory leak prevention
**Learning:** In Godot 4, dynamically created UI dialogs like `AcceptDialog` do not delete themselves automatically upon closing.
**Action:** Always connect their `confirmed` and `canceled` signals to `queue_free()` to prevent memory leaks in editor plugins.
