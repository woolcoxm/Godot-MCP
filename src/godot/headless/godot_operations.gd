extends SceneTree

var operations = {
	"create_project": funcref(self, "_create_project"),
	"read_project_settings": funcref(self, "_read_project_settings"),
	"modify_project_settings": funcref(self, "_modify_project_settings"),
	"set_main_scene": funcref(self, "_set_main_scene"),
	"read_file": funcref(self, "_read_file"),
	"write_file": funcref(self, "_write_file"),
	"list_directory": funcref(self, "_list_directory"),
	"delete_file": funcref(self, "_delete_file"),
	"create_scene": funcref(self, "_create_scene"),
	"read_scene": funcref(self, "_read_scene"),
	"modify_scene": funcref(self, "_modify_scene"),
	"save_scene": funcref(self, "_save_scene"),
	"create_node": funcref(self, "_create_node"),
	"modify_node": funcref(self, "_modify_node"),
	"delete_node": funcref(self, "_delete_node"),
}

func _ready():
	OS.set_low_processor_usage_mode(true)
	_process_operations()

func _process_operations():
	while true:
		var line = OS.read_string_from_stdin()
		if line == null or line.empty():
			yield(get_tree(), "idle_frame")
			continue
		
		var result = _process_operation(line)
		print("RESULT: " + JSON.print(result))

func _process_operation(line: String) -> Dictionary:
	var data = parse_json(line)
	if data == null:
		return {
			"success": false,
			"error": "Invalid JSON input"
		}
	
	var operation = data.get("operation", "")
	var params = data.get("params", {})
	
	if not operations.has(operation):
		return {
			"success": false,
			"error": "Unknown operation: " + operation
		}
	
	var func_ref = operations[operation]
	return func_ref.call_func(params)

func _create_project(params: Dictionary) -> Dictionary:
	var project_path = params.get("path", "")
	var project_name = params.get("name", "New Project")
	
	if project_path.empty():
		return {
			"success": false,
			"error": "Project path is required"
		}
	
	var dir = Directory.new()
	if dir.open("res://") != OK:
		return {
			"success": false,
			"error": "Cannot open resource directory"
		}
	
	if dir.dir_exists(project_path):
		return {
			"success": false,
			"error": "Project directory already exists"
		}
	
	if dir.make_dir_recursive(project_path) != OK:
		return {
			"success": false,
			"error": "Failed to create project directory"
		}
	
	var project_file = ProjectSettings.new()
	project_file.set_setting("application/config/name", project_name)
	project_file.set_setting("display/window/size/width", 1152)
	project_file.set_setting("display/window/size/height", 648)
	project_file.set_setting("rendering/renderer/rendering_method", "forward_plus")
	
	var project_file_path = project_path.plus_file("project.godot")
	if project_file.save(project_file_path) != OK:
		return {
			"success": false,
			"error": "Failed to save project.godot"
		}
	
	return {
		"success": true,
		"data": {
			"path": project_file_path,
			"name": project_name
		}
	}

func _read_project_settings(params: Dictionary) -> Dictionary:
	var project_path = params.get("path", "res://")
	
	var project_file = ProjectSettings.new()
	var project_file_path = project_path.plus_file("project.godot")
	
	if not File.new().file_exists(project_file_path):
		return {
			"success": false,
			"error": "project.godot not found"
		}
	
	if project_file.load(project_file_path) != OK:
		return {
			"success": false,
			"error": "Failed to load project.godot"
		}
	
	var settings = {}
	for property in project_file.get_property_list():
		var name = property.name
		if name.begins_with("application/") or name.begins_with("display/") or name.begins_with("rendering/"):
			settings[name] = project_file.get_setting(name)
	
	return {
		"success": true,
		"data": settings
	}

func _modify_project_settings(params: Dictionary) -> Dictionary:
	var project_path = params.get("path", "res://")
	var settings = params.get("settings", {})
	
	var project_file = ProjectSettings.new()
	var project_file_path = project_path.plus_file("project.godot")
	
	if not File.new().file_exists(project_file_path):
		return {
			"success": false,
			"error": "project.godot not found"
		}
	
	if project_file.load(project_file_path) != OK:
		return {
			"success": false,
			"error": "Failed to load project.godot"
		}
	
	for key in settings:
		project_file.set_setting(key, settings[key])
	
	if project_file.save(project_file_path) != OK:
		return {
			"success": false,
			"error": "Failed to save project.godot"
		}
	
	return {
		"success": true,
		"data": {
			"modified": settings.keys()
		}
	}

func _set_main_scene(params: Dictionary) -> Dictionary:
	var project_path = params.get("path", "res://")
	var scene_path = params.get("scene_path", "")
	
	if scene_path.empty():
		return {
			"success": false,
			"error": "Scene path is required"
		}
	
	var project_file = ProjectSettings.new()
	var project_file_path = project_path.plus_file("project.godot")
	
	if not File.new().file_exists(project_file_path):
		return {
			"success": false,
			"error": "project.godot not found"
		}
	
	if project_file.load(project_file_path) != OK:
		return {
			"success": false,
			"error": "Failed to load project.godot"
		}
	
	project_file.set_setting("application/run/main_scene", scene_path)
	
	if project_file.save(project_file_path) != OK:
		return {
			"success": false,
			"error": "Failed to save project.godot"
		}
	
	return {
		"success": true,
		"data": {
			"main_scene": scene_path
		}
	}

func _read_file(params: Dictionary) -> Dictionary:
	var file_path = params.get("path", "")
	
	if file_path.empty():
		return {
			"success": false,
			"error": "File path is required"
		}
	
	var file = File.new()
	if not file.file_exists(file_path):
		return {
			"success": false,
			"error": "File not found: " + file_path
		}
	
	if file.open(file_path, File.READ) != OK:
		return {
			"success": false,
			"error": "Failed to open file: " + file_path
		}
	
	var content = file.get_as_text()
	file.close()
	
	return {
		"success": true,
		"data": {
			"path": file_path,
			"content": content
		}
	}

func _write_file(params: Dictionary) -> Dictionary:
	var file_path = params.get("path", "")
	var content = params.get("content", "")
	var append = params.get("append", false)
	
	if file_path.empty():
		return {
			"success": false,
			"error": "File path is required"
		}
	
	var file = File.new()
	var mode = File.WRITE
	if append:
		mode = File.READ_WRITE
	
	if file.open(file_path, mode) != OK:
		return {
			"success": false,
			"error": "Failed to open file: " + file_path
		}
	
	if append:
		file.seek_end()
	
	file.store_string(content)
	file.close()
	
	return {
		"success": true,
		"data": {
			"path": file_path,
			"bytes_written": content.length()
		}
	}

func _list_directory(params: Dictionary) -> Dictionary:
	var dir_path = params.get("path", "res://")
	var recursive = params.get("recursive", false)
	
	var dir = Directory.new()
	if dir.open(dir_path) != OK:
		return {
			"success": false,
			"error": "Failed to open directory: " + dir_path
		}
	
	var files = []
	var directories = []
	
	dir.list_dir_begin(true, true)
	var file_name = dir.get_next()
	while file_name != "":
		if dir.current_is_dir():
			directories.append(file_name)
			if recursive:
				var subdir_files = _list_directory_recursive(dir_path.plus_file(file_name))
				files += subdir_files
		else:
			files.append(dir_path.plus_file(file_name))
		file_name = dir.get_next()
	
	dir.list_dir_end()
	
	return {
		"success": true,
		"data": {
			"path": dir_path,
			"files": files,
			"directories": directories
		}
	}

func _list_directory_recursive(dir_path: String) -> Array:
	var dir = Directory.new()
	if dir.open(dir_path) != OK:
		return []
	
	var files = []
	dir.list_dir_begin(true, true)
	var file_name = dir.get_next()
	while file_name != "":
		if not dir.current_is_dir():
			files.append(dir_path.plus_file(file_name))
		else:
			var subdir_files = _list_directory_recursive(dir_path.plus_file(file_name))
			files += subdir_files
		file_name = dir.get_next()
	
	dir.list_dir_end()
	return files

func _delete_file(params: Dictionary) -> Dictionary:
	var path = params.get("path", "")
	
	if path.empty():
		return {
			"success": false,
			"error": "Path is required"
		}
	
	var dir = Directory.new()
	if dir.file_exists(path):
		if dir.remove(path) != OK:
			return {
				"success": false,
				"error": "Failed to delete file: " + path
			}
	elif dir.dir_exists(path):
		if dir.remove(path) != OK:
			return {
				"success": false,
				"error": "Failed to delete directory: " + path
			}
	else:
		return {
			"success": false,
			"error": "Path not found: " + path
		}
	
	return {
		"success": true,
		"data": {
			"deleted": path
		}
	}

func _create_scene(params: Dictionary) -> Dictionary:
	var scene_path = params.get("path", "")
	var root_type = params.get("root_type", "Node3D")
	var root_name = params.get("root_name", "Root")
	
	if scene_path.empty():
		return {
			"success": false,
			"error": "Scene path is required"
		}
	
	var scene = PackedScene.new()
	var root_node
	
	match root_type:
		"Node3D":
			root_node = Spatial.new()
		"Node2D":
			root_node = Node2D.new()
		"Control":
			root_node = Control.new()
		_:
			root_node = Node.new()
	
	root_node.name = root_name
	scene.pack(root_node)
	
	var file = File.new()
	if file.open(scene_path, File.WRITE) != OK:
		return {
			"success": false,
			"error": "Failed to open file for writing: " + scene_path
		}
	
	file.store_string(scene.get_scene_source_code())
	file.close()
	
	return {
		"success": true,
		"data": {
			"path": scene_path,
			"root_type": root_type,
			"root_name": root_name
		}
	}

func _read_scene(params: Dictionary) -> Dictionary:
	var scene_path = params.get("path", "")
	
	if scene_path.empty():
		return {
			"success": false,
			"error": "Scene path is required"
		}
	
	var file = File.new()
	if not file.file_exists(scene_path):
		return {
			"success": false,
			"error": "Scene file not found: " + scene_path
		}
	
	if file.open(scene_path, File.READ) != OK:
		return {
			"success": false,
			"error": "Failed to open scene file: " + scene_path
		}
	
	var content = file.get_as_text()
	file.close()
	
	return {
		"success": true,
		"data": {
			"path": scene_path,
			"content": content
		}
	}

func _modify_scene(params: Dictionary) -> Dictionary:
	return {
		"success": false,
		"error": "Not implemented yet"
	}

func _save_scene(params: Dictionary) -> Dictionary:
	return {
		"success": false,
		"error": "Not implemented yet"
	}

func _create_node(params: Dictionary) -> Dictionary:
	return {
		"success": false,
		"error": "Not implemented yet"
	}

func _modify_node(params: Dictionary) -> Dictionary:
	return {
		"success": false,
		"error": "Not implemented yet"
	}

func _delete_node(params: Dictionary) -> Dictionary:
	return {
		"success": false,
		"error": "Not implemented yet"
	}