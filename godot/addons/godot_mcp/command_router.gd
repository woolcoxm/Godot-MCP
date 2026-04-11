extends RefCounted

var _handlers: Dictionary = {}

func _init() -> void:
	_handlers = {
		"project": "res://addons/godot_mcp/commands/project_commands.gd",
		"scene": "res://addons/godot_mcp/commands/scene_commands.gd",
		"node": "res://addons/godot_mcp/commands/node_commands.gd",
		"mesh": "res://addons/godot_mcp/commands/mesh_commands.gd",
		"skeleton": "res://addons/godot_mcp/commands/skeleton_commands.gd",
		"animation": "res://addons/godot_mcp/commands/animation_commands.gd",
		"material": "res://addons/godot_mcp/commands/material_commands.gd",
		"physics": "res://addons/godot_mcp/commands/physics_commands.gd",
		"lighting": "res://addons/godot_mcp/commands/lighting_commands.gd",
		"camera": "res://addons/godot_mcp/commands/camera_commands.gd",
		"script": "res://addons/godot_mcp/commands/script_commands.gd",
		"input": "res://addons/godot_mcp/commands/input_commands.gd",
		"resource": "res://addons/godot_mcp/commands/resource_commands.gd",
		"audio": "res://addons/godot_mcp/commands/audio_commands.gd",
		"ui": "res://addons/godot_mcp/commands/ui_commands.gd",
		"editor": "res://addons/godot_mcp/commands/editor_commands.gd",
		"particles": "res://addons/godot_mcp/commands/particle_commands.gd",
		"navigation": "res://addons/godot_mcp/commands/navigation_commands.gd",
	}

func dispatch(method: String, params: Dictionary) -> Dictionary:
	var parts = method.split("/", false, 1)
	if parts.size() != 2:
		return {"success": false, "error": "Invalid method format: '%s'. Expected 'category/action'." % method}
	var category: String = parts[0]
	var action: String = parts[1]
	if not _handlers.has(category):
		return {"success": false, "error": "Unknown category: '%s'. Valid categories: %s" % [category, _handlers.keys()]}
	var script_path: String = _handlers[category]
	var script = load(script_path)
	if not script:
		return {"success": false, "error": "Failed to load command handler: %s" % script_path}
	var handler = script.new()
	if not handler.has_method("handle"):
		return {"success": false, "error": "Handler %s missing 'handle' method" % script_path}
	var result = handler.handle(action, params)
	if result is Dictionary:
		return result
	return {"success": false, "error": "Handler returned invalid result"}
