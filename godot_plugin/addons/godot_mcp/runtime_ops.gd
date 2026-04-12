extends Node

# Runtime Operations Dispatcher
# Handles runtime-specific operations for MCP

func eval_gdscript(params: Dictionary) -> Dictionary:
	# Evaluate GDScript code at runtime
	var code = params.get("code", "")
	var capture_output = params.get("capture_output", false)
	
	if code.is_empty():
		return {"error": "No code provided"}
	
	# Create a temporary script
	var script = GDScript.new()
	script.source_code = code
	
	var error = script.reload()
	if error != OK:
		return {"error": "Failed to compile script: %d" % error}
	
	# Create instance and call
	var instance = script.new()
	if not instance:
		return {"error": "Failed to create script instance"}
	
	# Try to call a method if specified
	var method = params.get("method", "")
	var method_args = params.get("args", [])
	
	var result = null
	if method and instance.has_method(method):
		if method_args is Array:
			result = instance.callv(method, method_args)
		else:
			result = instance.call(method)
	else:
		# Just return the instance as dictionary
		result = _object_to_dict(instance)
	
	instance.free()
	
	return {"result": result}

func simulate_input(params: Dictionary) -> Dictionary:
	# Simulate input events
	var events = params.get("events", [])
	
	if not events is Array:
		return {"error": "Events must be an array"}
	
	for event_data in events:
		var event = _create_input_event(event_data)
		if event:
			Input.parse_input_event(event)
	
	return {"success": true, "events_processed": events.size()}

func take_screenshot(params: Dictionary) -> Dictionary:
	# Take a screenshot
	var viewport = get_tree().root
	var image = viewport.get_texture().get_image()
	
	if not image:
		return {"error": "Failed to capture viewport"}
	
	# Save to file if path provided
	var path = params.get("path", "")
	if path:
		var error = image.save_png(path)
		if error != OK:
			return {"error": "Failed to save screenshot: %d" % error}
		return {"success": true, "path": path, "size": image.get_size()}
	
	# Return as base64
	var png_data = image.save_png_to_buffer()
	var base64 = Marshalls.raw_to_base64(png_data)
	return {"success": true, "format": "png", "data": base64, "size": image.get_size()}

func get_debug_info(params: Dictionary) -> Dictionary:
	# Get debug information
	var include_nodes = params.get("include_nodes", false)
	var include_resources = params.get("include_resources", false)
	
	var info = {
		"performance": _get_performance_stats(),
		"memory": _get_memory_stats(),
		"scene": _get_scene_debug_info(include_nodes),
		"resources": _get_resource_stats() if include_resources else {}
	}
	
	return info

func set_game_state(params: Dictionary) -> Dictionary:
	# Modify game state
	var time_scale = params.get("time_scale", null)
	var paused = params.get("paused", null)
	
	if time_scale != null and time_scale is float:
		Engine.time_scale = time_scale
	
	if paused != null and paused is bool:
		get_tree().paused = paused
	
	return {
		"time_scale": Engine.time_scale,
		"paused": get_tree().paused
	}

func get_node_info(params: Dictionary) -> Dictionary:
	# Get information about a specific node
	var path = params.get("path", "")
	
	if path.is_empty():
		return {"error": "Node path required"}
	
	var node = get_tree().root.get_node_or_null(NodePath(path))
	if not node:
		return {"error": "Node not found: %s" % path}
	
	return _node_to_dict(node)

func call_node_method(params: Dictionary) -> Dictionary:
	# Call a method on a node
	var path = params.get("path", "")
	var method = params.get("method", "")
	var args = params.get("args", [])
	
	if path.is_empty() or method.is_empty():
		return {"error": "Path and method required"}
	
	var node = get_tree().root.get_node_or_null(NodePath(path))
	if not node:
		return {"error": "Node not found: %s" % path}
	
	if not node.has_method(method):
		return {"error": "Method not found: %s" % method}
	
	var result = null
	if args is Array:
		result = node.callv(method, args)
	else:
		result = node.call(method)
	
	return {"result": result}

func get_global_vars(_params: Dictionary) -> Dictionary:
	# Get global variables (autoloads)
	var autoloads = {}
	var root = get_tree().root
	
	for child in root.get_children():
		if child.is_in_group("_autoload"):
			autoloads[child.name] = child.get_class()
	
	return {"autoloads": autoloads}

func get_signal_connections(params: Dictionary) -> Dictionary:
	# Get signal connections for a node
	var path = params.get("path", "")
	
	if path.is_empty():
		return {"error": "Node path required"}
	
	var node = get_tree().root.get_node_or_null(NodePath(path))
	if not node:
		return {"error": "Node not found: %s" % path}
	
	var connections = []
	var signal_list = node.get_signal_list()
	
	for signal_info in signal_list:
		var signal_name = signal_info["name"]
		var conns = node.get_signal_connection_list(signal_name)
		for conn in conns:
			connections.append({
				"signal": signal_name,
				"target": str(conn["target"].get_path()),
				"method": conn["method"],
				"flags": conn["flags"]
			})
	
	return {"connections": connections}

# Helper methods
func _create_input_event(data: Dictionary) -> InputEvent:
	var event_type = data.get("type", "")
	
	match event_type:
		"key":
			var event = InputEventKey.new()
			event.keycode = data.get("keycode", 0)
			event.physical_keycode = data.get("physical_keycode", 0)
			event.pressed = data.get("pressed", false)
			event.echo = data.get("echo", false)
			return event
		
		"mouse_button":
			var event = InputEventMouseButton.new()
			event.button_index = data.get("button_index", 0)
			event.pressed = data.get("pressed", false)
			event.position = Vector2(data.get("x", 0), data.get("y", 0))
			return event
		
		"mouse_motion":
			var event = InputEventMouseMotion.new()
			event.position = Vector2(data.get("x", 0), data.get("y", 0))
			event.relative = Vector2(data.get("dx", 0), data.get("dy", 0))
			return event
		
		"joypad_button":
			var event = InputEventJoypadButton.new()
			event.button_index = data.get("button_index", 0)
			event.pressed = data.get("pressed", false)
			event.pressure = data.get("pressure", 0.0)
			return event
		
		"joypad_motion":
			var event = InputEventJoypadMotion.new()
			event.axis = data.get("axis", 0)
			event.axis_value = data.get("axis_value", 0.0)
			return event
		
		_:
			return null

func _get_performance_stats() -> Dictionary:
	return {
		"fps": Engine.get_frames_per_second(),
		"physics_fps": Engine.get_physics_ticks_per_second(),
		"process_time": Performance.get_monitor(Performance.TIME_PROCESS),
		"physics_time": Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS),
		"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"vertices": Performance.get_monitor(Performance.RENDER_TOTAL_VERTICES_IN_FRAME),
		"objects_drawn": Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)
	}

func _get_memory_stats() -> Dictionary:
	return {
		"static": OS.get_static_memory_usage(),
		"dynamic": OS.get_dynamic_memory_usage(),
		"static_peak": OS.get_static_memory_peak_usage(),
		"message_buffer": Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT)
	}

func _get_scene_debug_info(include_nodes: bool) -> Dictionary:
	var root = get_tree().root
	var info = {
		"current_scene": root.get_child(root.get_child_count() - 1).name if root.get_child_count() > 0 else "",
		"total_nodes": _count_nodes(root),
		"node_tree": _get_node_tree(root, 2) if include_nodes else {}
	}
	return info

func _get_resource_stats() -> Dictionary:
	# Note: Godot doesn't expose detailed resource stats easily
	return {
		"resource_count": ResourceCache.get_cached_resources().size()
	}

func _count_nodes(node: Node, depth: int = 0) -> int:
	if depth > 100:  # Prevent infinite recursion
		return 0
	
	var count = 1
	for child in node.get_children():
		count += _count_nodes(child, depth + 1)
	return count

func _get_node_tree(node: Node, max_depth: int) -> Dictionary:
	if max_depth <= 0:
		return {"name": node.name, "class": node.get_class()}
	
	var children = []
	for child in node.get_children():
		children.append(_get_node_tree(child, max_depth - 1))
	
	return {
		"name": node.name,
		"class": node.get_class(),
		"path": str(node.get_path()),
		"children": children
	}

func _node_to_dict(node: Node) -> Dictionary:
	var dict = {
		"name": node.name,
		"class": node.get_class(),
		"path": str(node.get_path()),
		"parent": str(node.get_parent().get_path()) if node.get_parent() else "",
		"child_count": node.get_child_count(),
		"groups": node.get_groups(),
		"properties": {}
	}
	
	# Get some common properties
	var properties = ["position", "rotation", "scale", "visible", "modulate"]
	for prop in properties:
		if node.has(prop):
			dict["properties"][prop] = node.get(prop)
	
	return dict

func _object_to_dict(obj: Object) -> Dictionary:
	var dict = {}
	var props = obj.get_property_list()
	
	for prop in props:
		var name = prop["name"]
		if name.begins_with("_"):
			continue
		
		var type = prop["type"]
		if type == TYPE_OBJECT:
			continue  # Skip object references
		
		try:
			var value = obj.get(name)
			# Convert basic types to JSON-serializable values
			if value is Vector2:
				dict[name] = {"x": value.x, "y": value.y}
			elif value is Vector3:
				dict[name] = {"x": value.x, "y": value.y, "z": value.z}
			elif value is Color:
				dict[name] = {"r": value.r, "g": value.g, "b": value.b, "a": value.a}
			elif value is Transform2D or value is Transform3D:
				continue  # Too complex
			elif value is Array or value is Dictionary or value is String or value is int or value is float or value is bool:
				dict[name] = value
		except:
			pass
	
	return dict