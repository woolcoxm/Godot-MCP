@tool
extends RefCounted

# Node operations for live node creation, modification, and deletion

func get_node_properties(node_path: String) -> Dictionary:
	var result = {"success": false, "error": ""}
	
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	var edited_scene_root = editor_interface.get_edited_scene_root()
	if not edited_scene_root:
		result["error"] = "No scene currently open in editor"
		return result
	
	var node = edited_scene_root.get_node_or_null(NodePath(node_path))
	if not node:
		result["error"] = "Node not found: " + node_path
		return result
	
	result["success"] = true
	result["data"] = {
		"node_path": node_path,
		"properties": _get_node_properties(node),
		"methods": _get_node_methods(node),
		"signals": _get_node_signals(node)
	}
	
	return result

func create_node(parent_path: String, node_type: String, name: String, properties: Dictionary = {}) -> Dictionary:
	var result = {"success": false, "error": ""}
	
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	var edited_scene_root = editor_interface.get_edited_scene_root()
	if not edited_scene_root:
		result["error"] = "No scene currently open in editor"
		return result
	
	# Find parent node
	var parent = edited_scene_root
	if not parent_path.is_empty() and parent_path != ".":
		parent = edited_scene_root.get_node_or_null(NodePath(parent_path))
		if not parent:
			result["error"] = "Parent node not found: " + parent_path
			return result
	
	# Create node
	var node = ClassDB.instantiate(node_type)
	if not node:
		result["error"] = "Failed to create node of type: " + node_type
		return result
	
	node.name = name
	
	# Apply properties
	for key in properties:
		_set_node_property(node, key, properties[key])
	
	# Add to scene
	parent.add_child(node)
	node.owner = edited_scene_root
	
	# Mark scene as modified
	editor_interface.get_undo_redo().create_action("Create Node")
	editor_interface.get_undo_redo().add_do_method(parent, "add_child", node)
	editor_interface.get_undo_redo().add_do_method(node, "set_owner", edited_scene_root)
	editor_interface.get_undo_redo().add_undo_method(parent, "remove_child", node)
	editor_interface.get_undo_redo().commit_action()
	
	result["success"] = true
	result["data"] = {
		"node_path": parent.get_path().get_concatenated_names() + "/" + name if parent != edited_scene_root else name,
		"node_type": node_type,
		"name": name,
		"properties": _get_node_properties(node)
	}
	
	return result

func modify_node(node_path: String, properties: Dictionary) -> Dictionary:
	var result = {"success": false, "error": ""}
	
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	var edited_scene_root = editor_interface.get_edited_scene_root()
	if not edited_scene_root:
		result["error"] = "No scene currently open in editor"
		return result
	
	var node = edited_scene_root.get_node_or_null(NodePath(node_path))
	if not node:
		result["error"] = "Node not found: " + node_path
		return result
	
	# Store old values for undo/redo
	var old_values = {}
	for key in properties:
		if node.has_property(key):
			old_values[key] = node.get(key)
	
	# Create undo/redo action
	editor_interface.get_undo_redo().create_action("Modify Node Properties")
	
	# Apply properties
	for key in properties:
		if node.has_property(key):
			editor_interface.get_undo_redo().add_do_method(node, "set", key, properties[key])
			if key in old_values:
				editor_interface.get_undo_redo().add_undo_method(node, "set", key, old_values[key])
	
	editor_interface.get_undo_redo().commit_action()
	
	result["success"] = true
	result["data"] = {
		"node_path": node_path,
		"modified_properties": properties.keys(),
		"new_properties": _get_node_properties(node)
	}
	
	return result

func delete_node(node_path: String) -> Dictionary:
	var result = {"success": false, "error": ""}
	
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	var edited_scene_root = editor_interface.get_edited_scene_root()
	if not edited_scene_root:
		result["error"] = "No scene currently open in editor"
		return result
	
	var node = edited_scene_root.get_node_or_null(NodePath(node_path))
	if not node:
		result["error"] = "Node not found: " + node_path
		return result
	
	var parent = node.get_parent()
	if not parent:
		result["error"] = "Node has no parent"
		return result
	
	# Store node data for undo
	var node_data = {
		"node": node,
		"parent": parent,
		"index": node.get_index(),
		"properties": _get_node_properties(node)
	}
	
	# Create undo/redo action
	editor_interface.get_undo_redo().create_action("Delete Node")
	editor_interface.get_undo_redo().add_do_method(parent, "remove_child", node)
	editor_interface.get_undo_redo().add_undo_method(parent, "add_child", node_data["node"])
	editor_interface.get_undo_redo().add_undo_method(node_data["node"], "set_owner", edited_scene_root)
	editor_interface.get_undo_redo().add_undo_method(parent, "move_child", node_data["node"], node_data["index"])
	
	# Restore properties
	for key in node_data["properties"]:
		var value = node_data["properties"][key]
		if node.has_property(key):
			editor_interface.get_undo_redo().add_undo_method(node, "set", key, value)
	
	editor_interface.get_undo_redo().commit_action()
	
	result["success"] = true
	result["data"] = {
		"node_path": node_path,
		"node_type": node.get_class(),
		"deleted": true
	}
	
	return result

func _get_node_properties(node: Node) -> Dictionary:
	var properties = {}
	
	# Get basic properties
	properties["name"] = node.name
	properties["type"] = node.get_class()
	
	# Try to get common properties
	var common_props = ["position", "rotation", "scale", "visible", "modulate", "size", "text", "value"]
	for prop in common_props:
		if node.has_property(prop):
			var value = node.get(prop)
			if value != null:
				properties[prop] = _convert_godot_value(value)
	
	# Get additional properties from property list
	var property_list = node.get_property_list()
	for prop in property_list:
		var name = prop["name"]
		var type = prop["type"]
		var usage = prop["usage"]
		
		# Skip internal properties and methods
		if name.begins_with("_") or name.contains("/") or usage & PROPERTY_USAGE_EDITOR == 0:
			continue
		
		# Skip already added properties
		if name in properties:
			continue
		
		var value = node.get(name)
		if value != null:
			properties[name] = _convert_godot_value(value)
	
	return properties

func _get_node_methods(node: Node) -> Array:
	var methods = []
	var method_list = node.get_method_list()
	
	for method in method_list:
		var name = method["name"]
		var flags = method["flags"]
		
		# Skip internal methods
		if name.begins_with("_"):
			continue
		
		methods.append({
			"name": name,
			"args": method["args"],
			"flags": flags
		})
	
	return methods

func _get_node_signals(node: Node) -> Array:
	var signals = []
	var signal_list = node.get_signal_list()
	
	for sig in signal_list:
		signals.append({
			"name": sig["name"],
			"args": sig["args"]
		})
	
	return signals

func _set_node_property(node: Node, key: String, value) -> bool:
	if not node.has_property(key):
		return false
	
	# Convert value to appropriate Godot type
	var godot_value = _convert_to_godot_value(value, node.get_property(key))
	node.set(key, godot_value)
	return true

func _convert_godot_value(value):
	if value is Vector2:
		return {"x": value.x, "y": value.y}
	elif value is Vector3:
		return {"x": value.x, "y": value.y, "z": value.z}
	elif value is Color:
		return {"r": value.r, "g": value.g, "b": value.b, "a": value.a}
	elif value is Rect2:
		return {"position": {"x": value.position.x, "y": value.position.y}, "size": {"x": value.size.x, "y": value.size.y}}
	elif value is Transform2D:
		return {
			"x": {"x": value.x.x, "y": value.x.y},
			"y": {"x": value.y.x, "y": value.y.y},
			"origin": {"x": value.origin.x, "y": value.origin.y}
		}
	elif value is Transform3D:
		return {
			"basis": {
				"x": {"x": value.basis.x.x, "y": value.basis.x.y, "z": value.basis.x.z},
				"y": {"x": value.basis.y.x, "y": value.basis.y.y, "z": value.basis.y.z},
				"z": {"x": value.basis.z.x, "y": value.basis.z.y, "z": value.basis.z.z}
			},
			"origin": {"x": value.origin.x, "y": value.origin.y, "z": value.origin.z}
		}
	elif value is Array or value is Dictionary:
		# Convert recursively for arrays and dictionaries
		var json = JSON.new()
		var error = json.stringify(value)
		if error == OK:
			return json.get_data()
		else:
			return str(value)
	else:
		return value

func _convert_to_godot_value(value, current_value):
	if current_value is Vector2 and value is Dictionary and "x" in value and "y" in value:
		return Vector2(value["x"], value["y"])
	elif current_value is Vector3 and value is Dictionary and "x" in value and "y" in value and "z" in value:
		return Vector3(value["x"], value["y"], value["z"])
	elif current_value is Color and value is Dictionary and "r" in value and "g" in value and "b" in value:
		var a = value["a"] if "a" in value else 1.0
		return Color(value["r"], value["g"], value["b"], a)
	elif current_value is Rect2 and value is Dictionary and "position" in value and "size" in value:
		var pos = value["position"]
		var size = value["size"]
		return Rect2(Vector2(pos["x"], pos["y"]), Vector2(size["x"], size["y"]))
	else:
		return value