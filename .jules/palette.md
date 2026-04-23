## 2024-05-20 - [Godot Editor Plugin Memory Leaks]
**Learning:** Dynamically created UI dialogs like `AcceptDialog` in Godot 4 editor plugins do not delete themselves automatically upon closing. This leads to memory leaks.
**Action:** Always connect the `confirmed` and `canceled` signals of dynamically created dialogs to `queue_free()` to prevent memory leaks.
