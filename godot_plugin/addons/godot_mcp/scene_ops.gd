@tool
extends RefCounted

# Scene operations for live scene tree queries and inspection

func get_current_scene() -> Dictionary:
	var result = {"success": false, "error": ""}
	
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	var edited_scene_root = editor_interface.get_edited_scene_root()
	if not edited_scene_root:
		result["error"] = "No scene currently open in editor"
		return result
	
	result["success"] = true
	result["data"] = {
		"scene_path": editor_interface.get_edited_scene_root().scene_file_path if editor_interface.get_edited_scene_root().scene_file_path else "",
		"root_node": _node_to_dict(edited_scene_root),
		"node_count": _count_nodes(edited_scene_root)
	}
	
	return result

func get_scene_tree(scene_path: String = "") -> Dictionary:
	var result = {"success": false, "error": ""}
	
	var editor_interface = Engine.get_main_loop().get_meta("__editor_interface", null)
	if not editor_interface:
		result["error"] = "Editor interface not available"
		return result
	
	var scene_root = null
	
	if scene_path.is_empty():
		# Use currently edited scene
		scene_root = editor_interface.get_edited_scene_root()
		if not scene_root:
			result["error"] = "No scene currently open in editor"
			return result
	else:
		# Try to load the scene from path
		var scene = load(scene_path)
		if not scene or not scene is PackedScene:
			result["error"] = "Failed to load scene from path: " + scene_path
			return result
		
		scene_root = scene.instantiate()
		if not scene_root:
			result["error"] = "Failed to instantiate scene from path: " + scene_path
			return result
	
	result["success"] = true
	result["data"] = {
		"scene_path": scene_path if not scene_path.is_empty() else (scene_root.scene_file_path if scene_root.scene_file_path else ""),
		"tree": _build_scene_tree(scene_root),
		"node_count": _count_nodes(scene_root)
	}
	
	# Clean up if we instantiated a scene
	if not scene_path.is_empty() and scene_root:
		scene_root.free()
	
	return result

func _build_scene_tree(node: Node, depth: int = 0) -> Dictionary:
	var node_dict = _node_to_dict(node)
	node_dict["children"] = []
	
	for child in node.get_children():
		node_dict["children"].append(_build_scene_tree(child, depth + 1))
	
	return node_dict

func _node_to_dict(node: Node) -> Dictionary:
	var dict = {
		"name": node.name,
		"type": node.get_class(),
		"path": node.get_path().get_concatenated_names(),
		"parent": node.get_parent().get_path().get_concatenated_names() if node.get_parent() else "",
		"child_count": node.get_child_count(),
		"properties": _get_node_properties(node)
	}
	
	return dict

func _get_node_properties(node: Node) -> Dictionary:
	var properties = {}
	
	# Get basic properties
	properties["position"] = _get_property_safe(node, "position", Vector3.ZERO if "3" in node.get_class() else Vector2.ZERO)
	properties["rotation"] = _get_property_safe(node, "rotation", Vector3.ZERO if "3" in node.get_class() else 0.0)
	properties["scale"] = _get_property_safe(node, "scale", Vector3.ONE if "3" in node.get_class() else Vector2.ONE)
	properties["visible"] = _get_property_safe(node, "visible", true)
	
	# Try to get more properties based on node type
	var property_list = node.get_property_list()
	for prop in property_list:
		var name = prop["name"]
		var type = prop["type"]
		var usage = prop["usage"]
		
		# Skip internal properties and methods
		if name.begins_with("_") or name.contains("/") or usage & PROPERTY_USAGE_EDITOR == 0:
			continue
		
		# Skip complex types for now
		if type == TYPE_OBJECT or type == TYPE_ARRAY or type == TYPE_DICTIONARY:
			continue
		
		try:
			var value = node.get(name)
			if value != null:
				# Convert Godot types to basic types
				if value is Vector2:
					properties[name] = {"x": value.x, "y": value.y}
				elif value is Vector3:
					properties[name] = {"x": value.x, "y": value.y, "z": value.z}
				elif value is Color:
					properties[name] = {"r": value.r, "g": value.g, "b": value.b, "a": value.a}
				elif value is Rect2:
					properties[name] = {"position": {"x": value.position.x, "y": value.position.y}, "size": {"x": value.size.x, "y": value.size.y}}
				elif value is Transform2D:
					properties[name] = {
						"x": {"x": value.x.x, "y": value.x.y},
						"y": {"x": value.y.x, "y": value.y.y},
						"origin": {"x": value.origin.x, "y": value.origin.y}
					}
				elif value is Transform3D:
					properties[name] = {
						"basis": {
							"x": {"x": value.basis.x.x, "y": value.basis.x.y, "z": value.basis.x.z},
							"y": {"x": value.basis.y.x, "y": value.basis.y.y, "z": value.basis.y.z},
							"z": {"x": value.basis.z.x, "y": value.basis.z.y, "z": value.basis.z.z}
						},
						"origin": {"x": value.origin.x, "y": value.origin.y, "z": value.origin.z}
					}
				else:
					properties[name] = value
		except:
			pass
	
	return properties

func _get_property_safe(node: Node, property: String, default):
	if node.has_method("get_" + property):
		return node.call("get_" + property)
	elif node.has_property(property):
		return node.get(property)
	else:
		return default

func _count_nodes(node: Node) -> int:
	var count = 1  # Count this node
	for child in node.get_children():
		count += _count_nodes(child)
	return count