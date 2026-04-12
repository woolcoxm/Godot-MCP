extends Node

# MCP Runtime Autoload
# Provides WebSocket server on port 13338 for runtime operations

const PORT = 13338
const MAX_CLIENTS = 1

var _server: WebSocketServer
var _peer: WebSocketPeer
var _operations: Node

func _ready() -> void:
	# Create operations dispatcher
	_operations = Node.new()
	_operations.name = "MCPRuntimeOperations"
	add_child(_operations)
	
	# Load runtime operations
	var runtime_ops = load("res://addons/godot_mcp/runtime_ops.gd")
	if runtime_ops:
		var ops_instance = runtime_ops.new()
		ops_instance.name = "RuntimeOps"
		_operations.add_child(ops_instance)
	
	# Start WebSocket server
	_server = WebSocketServer.new()
	_server.client_connected.connect(_on_client_connected)
	_server.client_disconnected.connect(_on_client_disconnected)
	_server.data_received.connect(_on_data_received)
	
	var err = _server.listen(PORT)
	if err != OK:
		push_error("MCP Runtime: Failed to start WebSocket server on port %d: %d" % [PORT, err])
	else:
		print("MCP Runtime: WebSocket server started on port %d" % PORT)

func _process(_delta: float) -> void:
	if _server:
		_server.poll()

func _on_client_connected(id: int, _protocol: String) -> void:
	print("MCP Runtime: Client connected: %d" % id)
	if _peer:
		# Only allow one client at a time
		_server.disconnect_peer(id, 1000, "Another client already connected")
		return
	
	_peer = _server.get_peer(id)
	print("MCP Runtime: Client %d ready" % id)

func _on_client_disconnected(id: int, _was_clean: bool) -> void:
	print("MCP Runtime: Client disconnected: %d" % id)
	if _peer and _peer.get_id() == id:
		_peer = null

func _on_data_received(id: int) -> void:
	if not _peer or _peer.get_id() != id:
		return
	
	var packet = _peer.get_packet()
	if packet.size() == 0:
		return
	
	var json_str = packet.get_string_from_utf8()
	var json = JSON.new()
	var parse_result = json.parse(json_str)
	
	if parse_result != OK:
		_send_error(id, "Invalid JSON: %s" % json.get_error_message())
		return
	
	var data = json.get_data()
	if not data is Dictionary:
		_send_error(id, "Expected dictionary")
		return
	
	# Process request
	_process_request(id, data)

func _process_request(id: int, request: Dictionary) -> void:
	var method = request.get("method", "")
	var params = request.get("params", {})
	var request_id = request.get("id", 0)
	
	if method.is_empty():
		_send_error(id, "Missing method", request_id)
		return
	
	# Dispatch to operations
	var result = _dispatch_to_operations(method, params)
	
	# Send response
	var response = {
		"jsonrpc": "2.0",
		"id": request_id,
		"result": result
	}
	
	_send_json(id, response)

func _dispatch_to_operations(method: String, params: Dictionary) -> Variant:
	# Check if method exists in any child of operations
	for child in _operations.get_children():
		if child.has_method(method):
			return child.call(method, params)
	
	# Check if method exists in self
	if has_method(method):
		return call(method, params)
	
	return {
		"error": "Method not found: %s" % method
	}

func _send_json(id: int, data: Dictionary) -> void:
	var json_str = JSON.stringify(data)
	var packet = json_str.to_utf8_buffer()
	
	if _peer and _peer.get_id() == id:
		_peer.put_packet(packet)

func _send_error(id: int, message: String, request_id: int = 0) -> void:
	var error_response = {
		"jsonrpc": "2.0",
		"id": request_id,
		"error": {
			"code": -32600,
			"message": message
		}
	}
	_send_json(id, error_response)

# Public API methods for runtime operations
func get_game_state(_params: Dictionary) -> Dictionary:
	return {
		"scene_tree": _get_scene_tree_info(),
		"performance": _get_performance_info(),
		"input": _get_input_info(),
		"time": _get_time_info()
	}

func _get_scene_tree_info() -> Dictionary:
	var root = get_tree().root
	var info = {
		"current_scene": root.get_child_count() > 0,
		"node_count": _count_nodes(root),
		"fps": Engine.get_frames_per_second()
	}
	return info

func _count_nodes(node: Node) -> int:
	var count = 1
	for child in node.get_children():
		count += _count_nodes(child)
	return count

func _get_performance_info() -> Dictionary:
	return {
		"fps": Engine.get_frames_per_second(),
		"memory": OS.get_static_memory_usage(),
		"physics_fps": Engine.get_physics_ticks_per_second(),
		"render_info": RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_PRIMITIVES_IN_FRAME)
	}

func _get_input_info() -> Dictionary:
	var inputs = []
	for action in InputMap.get_actions():
		inputs.append({
			"action": action,
			"pressed": Input.is_action_pressed(action)
		})
	return {
		"mouse_position": Input.get_mouse_position(),
		"actions": inputs
	}

func _get_time_info() -> Dictionary:
	return {
		"time_scale": Engine.time_scale,
		"physics_ticks": Engine.get_physics_frames(),
		"process_ticks": Engine.get_process_frames()
	}

func shutdown(_params: Dictionary) -> Dictionary:
	print("MCP Runtime: Shutting down")
	if _server:
		_server.stop()
	return {"success": true}