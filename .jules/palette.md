## 2024-05-18 - Editor Plugin Status Dialogs
**Learning:** In Godot 4 editor plugins, user-triggered status commands should use UI dialogs (like AcceptDialog) instead of console prints since the output panel may be hidden. Furthermore, dynamically created UI dialogs do not free themselves automatically upon closing; memory leaks must be prevented by connecting their `confirmed` and `canceled` signals to `queue_free()`.
**Action:** Always use AcceptDialog for status feedback and wire up `queue_free()` on close signals.
