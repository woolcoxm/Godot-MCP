@tool
extends RefCounted

# Editor operations for querying editor state, selection, and open scenes

func get_editor_info() -> Dictionary:
	var result = {"success": false, "error": ""}
	
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	# Get editor information
	var editor_settings = editor_interface.get_editor_settings()
	var editor_theme = editor_interface.get_editor_theme()
	
	result["success"] = true
	result["data"] = {
		"editor_version": Engine.get_version_info(),
		"project_name": ProjectSettings.get_setting("application/config/name", "Unnamed Project"),
		"project_path": ProjectSettings.globalize_path("res://"),
		"current_scene": _get_current_scene_info(editor_interface),
		"open_scenes": _get_open_scenes(editor_interface),
		"selection": _get_selection_info(editor_interface),
		"editor_state": _get_editor_state(editor_interface),
		"settings": _get_editor_settings_info(editor_settings)
	}
	
	return result

func _get_current_scene_info(editor_interface: EditorInterface) -> Dictionary:
	var scene_root = editor_interface.get_edited_scene_root()
	if not scene_root:
		return {"has_scene": false}
	
	return {
		"has_scene": true,
		"scene_path": scene_root.scene_file_path if scene_root.scene_file_path else "",
		"scene_name": scene_root.name,
		"node_count": _count_nodes(scene_root),
		"modified": editor_interface.is_scene_modified()
	}

func _get_open_scenes(editor_interface: EditorInterface) -> Array:
	var open_scenes = []
	
	# Get editor's scene tabs
	# Note: This is a simplified implementation
	# In a real implementation, we would access the editor's scene dock
	
	var edited_scene_root = editor_interface.get_edited_scene_root()
	if edited_scene_root:
		open_scenes.append({
			"path": edited_scene_root.scene_file_path if edited_scene_root.scene_file_path else "",
			"name": edited_scene_root.name,
			"is_current": true
		})
	
	return open_scenes

func _get_selection_info(editor_interface: EditorInterface) -> Dictionary:
	var selection = editor_interface.get_selection()
	var selected_nodes = selection.get_selected_nodes()
	
	var selected_paths = []
	for node in selected_nodes:
		selected_paths.append(node.get_path().get_concatenated_names())
	
	return {
		"count": selected_nodes.size(),
		"nodes": selected_paths,
		"primary": selected_paths[0] if selected_paths.size() > 0 else ""
	}

func _get_editor_state(editor_interface: EditorInterface) -> Dictionary:
	# Get various editor state information
	var state = {
		"play_mode": _get_play_mode(editor_interface),
		"active_dock": _get_active_dock(editor_interface),
		"viewport_mode": _get_viewport_mode(editor_interface),
		"grid_enabled": editor_interface.is_grid_visible(),
		"snap_enabled": editor_interface.is_snap_enabled(),
		"debugger_visible": editor_interface.is_debugger_visible(),
		"bottom_panel_visible": editor_interface.is_bottom_panel_visible()
	}
	
	return state

func _get_play_mode(editor_interface: EditorInterface) -> String:
	# Check if editor is in play mode
	# This is a simplified check
	if editor_interface.get_playing_scene():
		return "playing"
	elif editor_interface.is_playing_scene():
		return "paused"
	else:
		return "stopped"

func _get_active_dock(editor_interface: EditorInterface) -> String:
	# Determine which editor dock is active
	# This is a placeholder - actual implementation would use editor API
	return "scene"

func _get_viewport_mode(editor_interface: EditorInterface) -> String:
	# Get current viewport mode (2D, 3D, Script, etc.)
	# This is a placeholder - actual implementation would use editor API
	return "3D"

func _get_editor_settings_info(editor_settings: EditorSettings) -> Dictionary:
	# Get some editor settings
	var settings = {}
	
	# Get a few key settings
	var setting_keys = [
		"interface/theme/preset",
		"interface/editor/code_font",
		"interface/editor/font_size",
		"run/window_placement/rect",
		"filesystem/directories/autoscan_project_path"
	]
	
	for key in setting_keys:
		if editor_settings.has_setting(key):
			settings[key] = editor_settings.get_setting(key)
	
	return settings

func _count_nodes(node: Node) -> int:
	var count = 1  # Count this node
	for child in node.get_children():
		count += _count_nodes(child)
	return count

# Additional editor operations that could be implemented:
# - Switch to different scene
# - Open file in editor
# - Focus on node in scene tree
# - Change editor layout
# - Toggle editor panels
# - Change editor theme
# - Get editor shortcuts
# - Execute editor command
# - Get editor history (undo/redo)
# - Get editor plugins list
# - Check editor performance
# - Get editor memory usage
# - Capture editor screenshot
# - Get editor log
# - Set editor focus
# - Manage editor windows
# - Control editor playback
# - Access editor file system
# - Manage editor imports
# - Control editor build
# - Access editor debugger
# - Manage editor profiler
# - Control editor network profiler
# - Access editor visual profiler
# - Manage editor remote scene tree