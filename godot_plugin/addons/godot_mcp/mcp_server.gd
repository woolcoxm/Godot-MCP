@tool
extends Node

# WebSocket server for MCP communication
var server = null
var peers = {}
var server_port = 13337
var is_running = false

# Operation handlers
var scene_ops = null
var node_ops = null
var script_ops = null
var editor_ops = null

func _ready():
	# Load operation handlers
	scene_ops = load("res://addons/godot_mcp/scene_ops.gd").new() if ResourceLoader.exists("res://addons/godot_mcp/scene_ops.gd") else null
	node_ops = load("res://addons/godot_mcp/node_ops.gd").new() if ResourceLoader.exists("res://addons/godot_mcp/node_ops.gd") else null
	script_ops = load("res://addons/godot_mcp/script_ops.gd").new() if ResourceLoader.exists("res://addons/godot_mcp/script_ops.gd") else null
	editor_ops = load("res://addons/godot_mcp/editor_ops.gd").new() if ResourceLoader.exists("res://addons/godot_mcp/editor_ops.gd") else null

func start_server() -> bool:
	if is_running:
		print("[MCP Server] Server already running")
		return true
	
	server = WebSocketPeer.new()
	var error = server.listen(server_port, [], true)
	
	if error != OK:
		print("[MCP Server] Failed to start server on port ", server_port, ": ", error_string(error))
		server = null
		return false
	
	is_running = true
	print("[MCP Server] Server started on port ", server_port)
	return true

func stop_server():
	if server:
		server.stop()
		server = null
	
	# Close all peer connections
	for peer_id in peers:
		var peer = peers[peer_id]
		if peer:
			peer.close()
	
	peers.clear()
	is_running = false
	print("[MCP Server] Server stopped")

func is_server_running() -> bool:
	return is_running

func get_connection_count() -> int:
	return peers.size()

func _process(_delta):
	if not is_running or not server:
		return
	
	# Accept new connections
	while server.is_listening() and server.get_available_packet_count() > 0:
		var peer = server.take_connection()
		if peer:
			var peer_id = peer.get_unique_id()
			peers[peer_id] = peer
			print("[MCP Server] New connection: ", peer_id)
	
	# Process messages from all peers
	for peer_id in peers:
		var peer = peers[peer_id]
		if not peer:
			continue
		
		if peer.get_ready_state() == WebSocketPeer.STATE_CLOSED:
			print("[MCP Server] Connection closed: ", peer_id)
			peers.erase(peer_id)
			continue
		
		# Process incoming messages
		while peer.get_available_packet_count() > 0:
			var packet = peer.get_packet()
			var message = packet.get_string_from_utf8()
			_process_message(peer_id, message)

func _process_message(peer_id: int, message: String):
	print("[MCP Server] Received from ", peer_id, ": ", message)
	
	var response = {}
	
	try:
		var json = JSON.new()
		var error = json.parse(message)
		if error != OK:
			response = {
				"error": "Invalid JSON: " + json.get_error_message(),
				"success": false
			}
		else:
			var data = json.get_data()
			response = _handle_operation(data)
	except:
		response = {
			"error": "Exception processing message",
			"success": false
		}
	
	# Send response
	var peer = peers.get(peer_id)
	if peer:
		var response_json = JSON.stringify(response)
		peer.put_packet(response_json.to_utf8_buffer())
		print("[MCP Server] Sent to ", peer_id, ": ", response_json)

func _handle_operation(data: Dictionary) -> Dictionary:
	var operation = data.get("operation", "")
	var params = data.get("params", {})
	var request_id = data.get("id", "")
	
	var result = {
		"id": request_id,
		"success": false,
		"error": "Operation not implemented"
	}
	
	match operation:
		"ping":
			result = {"success": true, "data": {"message": "pong", "timestamp": Time.get_unix_time_from_system()}}
		
		"get_editor_info":
			if editor_ops:
				result = editor_ops.get_editor_info()
			else:
				result["error"] = "Editor operations not available"
		
		"get_current_scene":
			if scene_ops:
				result = scene_ops.get_current_scene()
			else:
				result["error"] = "Scene operations not available"
		
		"get_scene_tree":
			if scene_ops:
				result = scene_ops.get_scene_tree(params.get("scene_path", ""))
			else:
				result["error"] = "Scene operations not available"
		
		"get_node_properties":
			if node_ops:
				result = node_ops.get_node_properties(params.get("node_path", ""))
			else:
				result["error"] = "Node operations not available"
		
		"create_node":
			if node_ops:
				result = node_ops.create_node(
					params.get("parent_path", ""),
					params.get("node_type", ""),
					params.get("name", ""),
					params.get("properties", {})
				)
			else:
				result["error"] = "Node operations not available"
		
		"modify_node":
			if node_ops:
				result = node_ops.modify_node(
					params.get("node_path", ""),
					params.get("properties", {})
				)
			else:
				result["error"] = "Node operations not available"
		
		"delete_node":
			if node_ops:
				result = node_ops.delete_node(params.get("node_path", ""))
			else:
				result["error"] = "Node operations not available"
		
		"read_script":
			if script_ops:
				result = script_ops.read_script(params.get("script_path", ""))
			else:
				result["error"] = "Script operations not available"
		
		"write_script":
			if script_ops:
				result = script_ops.write_script(
					params.get("script_path", ""),
					params.get("content", "")
				)
			else:
				result["error"] = "Script operations not available"
		
		"list_tools":
			# Return list of available operations
			result = {
				"success": true,
				"data": {
					"tools": [
						"ping",
						"get_editor_info",
						"get_current_scene",
						"get_scene_tree",
						"get_node_properties",
						"create_node",
						"modify_node",
						"delete_node",
						"read_script",
						"write_script"
					],
					"capabilities": {
						"scene_ops": scene_ops != null,
						"node_ops": node_ops != null,
						"script_ops": script_ops != null,
						"editor_ops": editor_ops != null
					}
				}
			}
		
		_:
			result["error"] = "Unknown operation: " + operation
	
	return result