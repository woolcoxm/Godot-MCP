extends RefCounted

func _resolve_node(path: String) -> Node:
	var root = EditorInterface.get_edited_scene_root()
	if not root:
		return null
	if path.begins_with("/"):
		path = path.substr(1)
	if path.is_empty():
		return root
	return root.get_node_or_null(path)

func _to_json(val) -> Variant:
	if val is Vector2:
		return {"x": val.x, "y": val.y}
	elif val is Vector3:
		return {"x": val.x, "y": val.y, "z": val.z}
	elif val is Vector4:
		return {"x": val.x, "y": val.y, "z": val.z, "w": val.w}
	elif val is Quaternion:
		return {"x": val.x, "y": val.y, "z": val.z, "w": val.w}
	elif val is Color:
		return "#" + val.to_html(false)
	elif val is Basis:
		return {"x": {"x": val.x.x, "y": val.x.y, "z": val.x.z}, "y": {"x": val.y.x, "y": val.y.y, "z": val.y.z}, "z": {"x": val.z.x, "y": val.z.y, "z": val.z.z}}
	elif val is Transform3D:
		return {"basis": _to_json(val.basis), "origin": _to_json(val.origin)}
	elif val is AABB:
		return {"position": _to_json(val.position), "size": _to_json(val.size)}
	elif val is Dictionary:
		var result = {}
		for key in val:
			result[key] = _to_json(val[key])
		return result
	elif val is Array:
		var result = []
		for item in val:
			result.append(_to_json(item))
		return result
	elif val is Node:
		return str(val.get_path())
	elif val is Resource:
		return val.resource_path if val.resource_path else str(val)
	elif val is RID:
		return str(val)
	return val

func handle(action: String, params: Dictionary) -> Dictionary:
	match action:
		"create":
			return _create(params)
		"attach":
			return _attach(params)
		"read":
			return _read(params)
		"edit":
			return _edit(params)
		"set_variable":
			return _set_variable(params)
		_:
			return {"success": false, "error": "Unknown action: " + action}

func _create(params: Dictionary) -> Dictionary:
	var script_path: String = params.get("path", "")
	var content: String = params.get("content", "")
	var extends_class: String = params.get("extends_class", "")
	var class_name_val: String = params.get("class_name", "")
	var final_content: String = ""
	if not class_name_val.is_empty():
		final_content += "class_name " + class_name_val + "\n"
	if not extends_class.is_empty():
		final_content += "extends " + extends_class + "\n"
	if not final_content.is_empty():
		final_content += "\n"
	final_content += content
	var dir = script_path.get_base_dir()
	if not DirAccess.dir_exists_absolute(dir):
		DirAccess.make_dir_recursive_absolute(dir)
	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if not file:
		return {"success": false, "error": "Failed to open file for writing: " + script_path}
	file.store_string(final_content)
	file.close()
	EditorInterface.get_resource_filesystem().scan()
	return {"success": true, "path": script_path, "class_name": class_name_val, "extends_class": extends_class}

func _attach(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("node_path", "")
	var script_path: String = params.get("script_path", "")
	var node = _resolve_node(node_path)
	if not node:
		return {"success": false, "error": "Node not found: " + node_path}
	var script = ResourceLoader.load(script_path)
	if not script:
		return {"success": false, "error": "Failed to load script: " + script_path}
	node.set_script(script)
	return {"success": true}

func _read(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var script = ResourceLoader.load(path)
	if not script:
		return {"success": false, "error": "Failed to load script: " + path}
	var source_code: String = ""
	if script is Script:
		source_code = script.source_code
	else:
		return {"success": false, "error": "Resource is not a script: " + path}
	return {"success": true, "path": path, "content": source_code}

func _edit(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var content: String = params.get("content", "")
	var script = ResourceLoader.load(path)
	if not script:
		return {"success": false, "error": "Failed to load script: " + path}
	if script is Script:
		script.source_code = content
		var err = ResourceSaver.save(script)
		if err != OK:
			return {"success": false, "error": "Failed to save script: " + str(err)}
		EditorInterface.get_script_editor().reload_scripts()
		return {"success": true}
	else:
		return {"success": false, "error": "Resource is not a script: " + path}

func _set_variable(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("node_path", "")
	var variable_name: String = params.get("variable_name", "")
	var value = params.get("value", null)
	var node = _resolve_node(node_path)
	if not node:
		return {"success": false, "error": "Node not found: " + node_path}
	node.set(variable_name, value)
	return {"success": true}
