extends Node

# Runtime Operations Dispatcher
# Handles runtime-specific operations for MCP

func get_system_info() -> Dictionary:
	var info = {
		"success": true,
		"data": {
			"engine": {
				"version": Engine.get_version_info(),
				"fps": Engine.get_frames_per_second(),
				"target_fps": Engine.get_target_fps(),
				"physics_ticks_per_second": Engine.get_physics_ticks_per_second()
			},
			"os": {
				"name": OS.get_name(),
				"version": OS.get_version(),
				"locale": OS.get_locale(),
				"model": OS.get_model_name() if OS.has_method("get_model_name") else "Unknown"
			},
			"display": {
				"screen_count": DisplayServer.get_screen_count(),
				"primary_screen": DisplayServer.get_primary_screen(),
				"screen_size": DisplayServer.screen_get_size(DisplayServer.get_primary_screen()),
				"screen_dpi": DisplayServer.screen_get_dpi(DisplayServer.get_primary_screen())
			},
			"memory": _get_memory_info(),
			"performance": _get_performance_info()
		}
	}
	return info

func _get_memory_info() -> Dictionary:
	var memory_info = {}
	
	# Get memory usage from Performance singleton
	memory_info["static"] = Performance.get_monitor(Performance.MEMORY_STATIC)
	memory_info["dynamic"] = Performance.get_monitor(Performance.MEMORY_DYNAMIC)
	memory_info["static_max"] = Performance.get_monitor(Performance.MEMORY_STATIC_MAX)
	memory_info["dynamic_max"] = Performance.get_monitor(Performance.MEMORY_DYNAMIC_MAX)
	
	# Try to get additional memory info if available
	if OS.has_method("get_static_memory_usage"):
		memory_info["static_usage"] = OS.get_static_memory_usage()
	if OS.has_method("get_dynamic_memory_usage"):
		memory_info["dynamic_usage"] = OS.get_dynamic_memory_usage()
	
	return memory_info

func _get_performance_info() -> Dictionary:
	var perf_info = {}
	
	# Get common performance metrics
	perf_info["fps"] = Performance.get_monitor(Performance.TIME_FPS)
	perf_info["process_time"] = Performance.get_monitor(Performance.TIME_PROCESS)
	perf_info["physics_process_time"] = Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS)
	
	# Object counts
	perf_info["object_count"] = Performance.get_monitor(Performance.OBJECT_COUNT)
	perf_info["resource_count"] = Performance.get_monitor(Performance.OBJECT_RESOURCE_COUNT)
	perf_info["node_count"] = Performance.get_monitor(Performance.OBJECT_NODE_COUNT)
	
	# Render statistics
	perf_info["total_objects"] = Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)
	perf_info["total_primitives"] = Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
	perf_info["total_draw_calls"] = Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
	
	# Video memory (if available)
	if Performance.get_monitor_count() > Performance.RENDER_VIDEO_MEM_USED:
		perf_info["video_mem_used"] = Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED)
		perf_info["video_mem_max"] = Performance.get_monitor(Performance.RENDER_VIDEO_MEM_MAX)
	
	return perf_info

func get_resource_info() -> Dictionary:
	var resources = []
	
	# Get cached resources
	var cached_resources = ResourceLoader.get_cached_resources()
	for resource in cached_resources:
		if resource:
			var resource_info = {
				"path": resource.resource_path,
				"type": resource.get_class(),
				"size": _estimate_resource_size(resource)
			}
			resources.append(resource_info)
	
	return {
		"success": true,
		"data": {
			"cached_resources": resources,
			"total_count": resources.size()
		}
	}

func _estimate_resource_size(resource: Resource) -> int:
	# Simple estimation of resource size
	# This is a rough estimate and not exact
	var size = 0
	
	# Check if resource has properties we can estimate
	var property_list = resource.get_property_list()
	for prop in property_list:
		var name = prop["name"]
		var type = prop["type"]
		
		# Skip internal properties
		if name.begins_with("_"):
			continue
		
		# Estimate size based on type
		match type:
			TYPE_STRING:
				var value = resource.get(name)
				if value is String:
					size += value.length()
			TYPE_ARRAY:
				var value = resource.get(name)
				if value is Array:
					size += value.size() * 8  # Rough estimate
			TYPE_DICTIONARY:
				var value = resource.get(name)
				if value is Dictionary:
					size += value.size() * 16  # Rough estimate
			TYPE_INT, TYPE_FLOAT, TYPE_BOOL:
				size += 4
			TYPE_VECTOR2, TYPE_VECTOR3, TYPE_COLOR:
				size += 16
	
	return size

func get_scene_tree_info() -> Dictionary:
	var tree = get_tree()
	if not tree:
		return {"success": false, "error": "No scene tree available"}
	
	var root = tree.get_root()
	if not root:
		return {"success": false, "error": "No root node"}
	
	var scene_info = _serialize_node(root)
	
	return {
		"success": true,
		"data": {
			"root": scene_info,
			"current_scene": tree.current_scene.get_path() if tree.current_scene else "",
			"node_count": _count_nodes(root)
		}
	}

func _serialize_node(node: Node) -> Dictionary:
	var node_info = {
		"name": node.name,
		"type": node.get_class(),
		"path": str(node.get_path()),
		"children": []
	}
	
	# Add basic properties
	var properties = {}
	for child in node.get_children():
		node_info["children"].append(_serialize_node(child))
	
	return node_info

func _count_nodes(node: Node) -> int:
	var count = 1  # Count this node
	for child in node.get_children():
		count += _count_nodes(child)
	return count

func get_global_properties() -> Dictionary:
	var properties = {}
	
	# Get global properties from ProjectSettings
	var project_settings = ProjectSettings.get_setting_list()
	for setting in project_settings:
		if setting is String and not setting.begins_with("_"):
			var value = ProjectSettings.get_setting(setting)
			properties[setting] = _convert_godot_value(value)
	
	return {
		"success": true,
		"data": {
			"project_settings": properties
		}
	}

func _convert_godot_value(value) -> Variant:
	# Convert Godot types to JSON-serializable values
	if value is Vector2:
		return {"x": value.x, "y": value.y}
	elif value is Vector3:
		return {"x": value.x, "y": value.y, "z": value.z}
	elif value is Color:
		return {"r": value.r, "g": value.g, "b": value.b, "a": value.a}
	elif value is Rect2:
		return {"position": {"x": value.position.x, "y": value.position.y}, "size": {"x": value.size.x, "y": value.size.y}}
	elif value is Array or value is Dictionary or value is String or value is int or value is float or value is bool:
		return value
	else:
		return str(value)

func _convert_to_godot_value(value, default_value) -> Variant:
	# Convert JSON values back to Godot types
	if value is Dictionary:
		if "x" in value and "y" in value:
			if "z" in value:
				return Vector3(value.x, value.y, value.z)
			else:
				return Vector2(value.x, value.y)
		elif "r" in value and "g" in value and "b" in value:
			var a = value.a if "a" in value else 1.0
			return Color(value.r, value.g, value.b, a)
	
	return value