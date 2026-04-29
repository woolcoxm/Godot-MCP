## 2024-03-20 - Godot Editor Plugin UX Feedback

**Learning:** When building user-triggered commands for a Godot Editor plugin (like "Show Status"), relying only on `print()` results in poor UX because the user might have their console hidden. Furthermore, when creating dynamic UI dialogs (like `AcceptDialog`) to show this feedback, it is critical in Godot 4 to connect the `confirmed` and `canceled` signals to `queue_free` to avoid memory leaks since they don't auto-delete.

**Action:** Whenever I create a user-triggered command in an editor plugin, I will use an `AcceptDialog` to surface the information to the user directly over the editor interface, and ensure I properly connect the signals to manage the dialog's lifecycle.
