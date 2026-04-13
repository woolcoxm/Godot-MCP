@tool
extends Node

# WebSocket server for MCP communication
var server: WebSocketMultiplayerPeer = null
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
	
	server = WebSocketMultiplayerPeer.new()
	var error = server.create_server(server_port)
	
	if error != OK:
		print("[MCP Server] Failed to start server on port ", server_port, ": ", error_string(error))
		server = null
		return false
	
	is_running = true
	print("[MCP Server] Server started on port ", server_port)
	return true

func stop_server():
	if server:
		server.close()
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
	if server:
		return server.get_connected_peers().size()
	return 0

func _process(_delta):
	if not is_running or not server:
		return
	
	server.poll()
	
	# Check for new connections and messages
	while server.get_available_packet_count() > 0:
		var result = server.receive_packet()
		if result is Array and result.size() >= 2:
			var peer_id = result[0]
			var packet = result[1]
			
			if not peers.has(peer_id):
				peers[peer_id] = true
				print("[MCP Server] New connection: ", peer_id)
			
			# Process the message
			var message = packet.get_string_from_utf8()
			_process_message(peer_id, message)
	
	# Check for disconnected peers
	for peer_id in peers.keys():
		if not server.is_peer_connected(peer_id):
			print("[MCP Server] Connection closed: ", peer_id)
			peers.erase(peer_id)

func _process_message(peer_id: int, message: String):
	print("[MCP Server] Received from ", peer_id, ": ", message)
	
	var response = {}
	
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
	
	# Send response
	if server and server.is_peer_connected(peer_id):
		var response_json = JSON.stringify(response)
		# Use send_packet() which takes peer_id and packet
		server.send_packet(peer_id, response_json.to_utf8_buffer())
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