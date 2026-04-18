@tool
extends RefCounted

# Script operations for live script editing in editor

func _is_path_safe(path: String) -> bool:
	var simplified = path.simplify_path()
	if not simplified.begins_with("res://"):
		return false
	if ".." in simplified:
		return false
	return true

func read_script(script_path: String) -> Dictionary:
	var result = {"success": false, "error": ""}
	
	# Check if path is valid
	if script_path.is_empty():
		result["error"] = "Script path is empty"
		return result
	
	if not _is_path_safe(script_path):
		result["error"] = "Unsafe path detected: " + script_path
		return result

	# Try to load the script
	var script = load(script_path)
	if not script:
		result["error"] = "Failed to load script from path: " + script_path
		return result
	
	# Read file content
	var file = FileAccess.open(script_path, FileAccess.READ)
	if not file:
		result["error"] = "Failed to open script file: " + script_path
		return result
	
	var content = file.get_as_text()
	file.close()
	
	result["success"] = true
	result["data"] = {
		"script_path": script_path,
		"content": content,
		"size": content.length(),
		"lines": content.split("\n").size(),
		"script_type": script.get_class(),
		"has_errors": _check_script_errors(script)
	}
	
	return result

func write_script(script_path: String, content: String) -> Dictionary:
	var result = {"success": false, "error": ""}
	
	# Check if path is valid
	if script_path.is_empty():
		result["error"] = "Script path is empty"
		return result
	
	if not _is_path_safe(script_path):
		result["error"] = "Unsafe path detected: " + script_path
		return result

	# Check if we're in editor
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	# Get current script content for undo/redo
	var old_content = ""
	var file = FileAccess.open(script_path, FileAccess.READ)
	if file:
		old_content = file.get_as_text()
		file.close()
	
	# Create undo/redo action
	editor_interface.get_undo_redo().create_action("Edit Script")
	editor_interface.get_undo_redo().add_do_method(self, "_write_script_file", script_path, content)
	editor_interface.get_undo_redo().add_undo_method(self, "_write_script_file", script_path, old_content)
	editor_interface.get_undo_redo().commit_action()
	
	# Reload script in editor
	editor_interface.get_resource_filesystem().scan()
	
	result["success"] = true
	result["data"] = {
		"script_path": script_path,
		"size": content.length(),
		"lines": content.split("\n").size(),
		"written": true
	}
	
	return result

func _write_script_file(script_path: String, content: String) -> void:
	var dir = DirAccess.open("res://")
	if not dir:
		print("[Script Ops] Failed to open directory")
		return
	
	# Ensure directory exists
	var dir_path = script_path.get_base_dir()
	if not dir.dir_exists(dir_path):
		dir.make_dir_recursive(dir_path)
	
	# Write file
	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(content)
		file.close()
		print("[Script Ops] Script written: ", script_path)
	else:
		print("[Script Ops] Failed to write script: ", script_path)

func _check_script_errors(script: Script) -> bool:
	# Check if script has syntax errors
	# Note: This is a simplified check - in a real implementation,
	# we would use Godot's script editor API to get actual errors
	if script is GDScript:
		var gdscript: GDScript = script
		# Try to reload to check for errors
		gdscript.reload()
		# Check if there are any parse errors
		# This is a placeholder - actual error checking would be more complex
		return false
	return false

# Additional script operations that could be implemented:
# - Create new script
# - Rename script
# - Delete script
# - Get script dependencies
# - Check script syntax
# - Run script tests
# - Get script documentation
# - Find references to script
# - Refactor script (rename variables, extract methods, etc.)