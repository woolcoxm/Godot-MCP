## 2024-05-24 - Visual Feedback for Editor Commands
**Learning:** Console logging alone is insufficient for Godot editor tools, as the bottom panel is often collapsed or hidden from view.
**Action:** Use native Godot UI dialogs (like `AcceptDialog`) to provide immediate, visible feedback when a user triggers an editor tool action such as starting, stopping, or checking status.
