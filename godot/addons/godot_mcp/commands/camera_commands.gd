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
		"set_properties":
			return _set_properties(params)
		"get_image":
			return _get_image(params)
		_:
			return {"success": false, "error": "Unknown action: " + action}

func _create(params: Dictionary) -> Dictionary:
	var camera = Camera3D.new()
	if params.has("fov"):
		camera.fov = params.fov
	if params.has("near"):
		camera.near = params.near
	if params.has("far"):
		camera.far = params.far
	if params.has("projection"):
		camera.projection = params.projection
	if params.has("current"):
		camera.current = params.current
	if params.has("h_offset"):
		camera.h_offset = params.h_offset
	if params.has("v_offset"):
		camera.v_offset = params.v_offset
	if params.has("keep_aspect"):
		camera.keep_aspect = params.keep_aspect
	if params.has("cull_mask"):
		camera.cull_mask = params.cull_mask
	if params.has("environment"):
		var env = params.environment
		if env is String:
			camera.environment = load(env)
		else:
			camera.environment = env
	if params.has("attributes"):
		var attrs = params.attributes
		if attrs is String:
			camera.attributes = load(attrs)
		else:
			camera.attributes = attrs
	if params.has("name"):
		camera.name = params.name
	var parent: Node
	if params.has("parent_path"):
		parent = _resolve_node(params.parent_path)
	else:
		parent = EditorInterface.get_edited_scene_root()
	if not parent:
		return {"success": false, "error": "Parent node not found"}
	parent.add_child(camera)
	camera.set_owner(EditorInterface.get_edited_scene_root())
	return {"success": true, "path": str(camera.get_path())}

func _set_properties(params: Dictionary) -> Dictionary:
	var camera: Camera3D
	if params.has("path"):
		camera = _resolve_node(params.path)
	elif params.has("node_path"):
		camera = _resolve_node(params.node_path)
	if not camera:
		return {"success": false, "error": "Camera not found"}
	var props = params.get("properties", {})
	if props is Dictionary:
		for prop in props:
			camera.set(prop, props[prop])
	return {"success": true}

func _get_image(params: Dictionary) -> Dictionary:
	var camera: Camera3D
	if params.has("path"):
		camera = _resolve_node(params.path)
	elif params.has("node_path"):
		camera = _resolve_node(params.node_path)
	if not camera:
		return {"success": false, "error": "Camera not found"}
	var viewport = camera.get_viewport()
	var texture = viewport.get_texture()
	var image = texture.get_image()
	var buffer = image.save_png_to_buffer()
	if buffer.is_empty():
		return {"success": false, "error": "Failed to capture image"}
	var base64 = Marshalls.raw_to_base64(buffer)
	return {"success": true, "data": base64, "width": image.get_width(), "height": image.get_height()}
