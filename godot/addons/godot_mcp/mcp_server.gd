extends Node

var _server: TCPServer
var _peers: Dictionary = {}
var _next_peer_id: int = 0
var _command_router: CommandRouter
const PORT: int = 9900

func _ready() -> void:
	_command_router = CommandRouter.new()

func start() -> void:
	_server = TCPServer.new()
	var err = _server.listen(PORT, "127.0.0.1")
	if err == OK:
		print("[godot-mcp] WebSocket server listening on ws://127.0.0.1:%d" % PORT)
	else:
		push_error("[godot-mcp] Failed to start WebSocket server on port %d: %s" % [PORT, error_string(err)])

func stop() -> void:
	for peer_id in _peers:
		_peers[peer_id].get_peer(1).close()
	_peers.clear()
	if _server:
		_server.stop()

func _process(_delta: float) -> void:
	if not _server or not _server.is_listening():
		return
	while _server.is_connection_available():
		var connection = _server.take_connection()
		var peer := WebSocketPeer.new()
		peer.accept_stream(connection)
		var peer_id = _next_peer_id
		_next_peer_id += 1
		_peers[peer_id] = peer
		print("[godot-mcp] Client connected (peer %d)" % peer_id)
	var to_remove := []
	for peer_id in _peers:
		var peer: WebSocketPeer = _peers[peer_id]
		peer.poll()
		var state = peer.get_ready_state()
		if state == WebSocketPeer.STATE_OPEN:
			while peer.get_available_packet_count() > 0:
				var packet = peer.get_packet()
				var text = packet.get_string_from_utf8()
				_handle_message(peer_id, text)
		elif state == WebSocketPeer.STATE_CLOSED:
			var code = peer.get_close_code()
			var reason = peer.get_close_reason()
			print("[godot-mcp] Client disconnected (peer %d): code=%d reason=%s" % [peer_id, code, reason])
			to_remove.append(peer_id)
	for peer_id in to_remove:
		_peers.erase(peer_id)

func _handle_message(peer_id: int, text: String) -> void:
	var json = JSON.new()
	var error = json.parse(text)
	if error != OK:
		_send_error(peer_id, 0, -32700, "Parse error: " + json.get_error_message())
		return
	var data = json.get_data()
	if not data is Dictionary:
		_send_error(peer_id, 0, -32600, "Invalid Request: expected object")
		return
	var req: Dictionary = data
	var req_id = req.get("id", 0)
	if req.get("jsonrpc") != "2.0":
		_send_error(peer_id, req_id, -32600, "Invalid Request: missing jsonrpc 2.0")
		return
	var method: String = req.get("method", "")
	var params: Dictionary = req.get("params", {})
	if method.is_empty():
		_send_error(peer_id, req_id, -32602, "Invalid params: missing method")
		return
	var result = _command_router.dispatch(method, params)
	_send_response(peer_id, req_id, result)

func _send_response(peer_id: int, req_id: Variant, result: Dictionary) -> void:
	var response = {
		"jsonrpc": "2.0",
		"id": req_id,
		"result": result
	}
	_send_json(peer_id, response)

func _send_error(peer_id: int, req_id: Variant, code: int, message: String) -> void:
	var response = {
		"jsonrpc": "2.0",
		"id": req_id,
		"error": {
			"code": code,
			"message": message
		}
	}
	_send_json(peer_id, response)

func _send_json(peer_id: int, data: Dictionary) -> void:
	if _peers.has(peer_id):
		var json_string = JSON.stringify(data)
		_peers[peer_id].send_text(json_string)
