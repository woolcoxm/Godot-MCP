@tool
extends EditorPlugin

var _mcp_server: Node

func _enter_tree() -> void:
	_mcp_server = McpServer.new()
	add_child(_mcp_server)
	_mcp_server.start()

func _exit_tree() -> void:
	if _mcp_server:
		_mcp_server.stop()
		remove_child(_mcp_server)
		_mcp_server.free()
