@tool
extends EditorPlugin

var mcp_server = null
var server_port = 13337
var _info_dialog = null

func _enter_tree():
	print("[Godot MCP] Plugin loading...")
	
	# Load MCP server script
	var server_script = load("res://addons/godot_mcp/mcp_server.gd")
	if server_script:
		mcp_server = server_script.new()
		mcp_server.server_port = server_port
		add_child(mcp_server)
		
		if mcp_server.start_server():
			print("[Godot MCP] WebSocket server started on port ", server_port)
		else:
			print("[Godot MCP] Failed to start WebSocket server")
	else:
		print("[Godot MCP] Failed to load mcp_server.gd")
	
	# Setup info dialog for visual feedback
	_info_dialog = AcceptDialog.new()
	_info_dialog.title = "Godot MCP"
	get_editor_interface().get_base_control().add_child(_info_dialog)

	# Add plugin menu items
	add_tool_menu_item("Godot MCP: Restart Server", _restart_server)
	add_tool_menu_item("Godot MCP: Stop Server", _stop_server)
	add_tool_menu_item("Godot MCP: Show Status", _show_status)

func _exit_tree():
	print("[Godot MCP] Plugin unloading...")
	
	# Remove menu items
	remove_tool_menu_item("Godot MCP: Restart Server")
	remove_tool_menu_item("Godot MCP: Stop Server")
	remove_tool_menu_item("Godot MCP: Show Status")
	
	# Stop server
	if mcp_server:
		mcp_server.stop_server()
		remove_child(mcp_server)
		mcp_server = null

	# Clean up dialog
	if _info_dialog:
		_info_dialog.queue_free()
		_info_dialog = null
	
	print("[Godot MCP] Plugin unloaded")

func _show_dialog(title: String, text: String):
	if _info_dialog:
		_info_dialog.title = title
		_info_dialog.dialog_text = text
		_info_dialog.popup_centered()

func _restart_server():
	var msg = "Restarting server..."
	print("[Godot MCP] " + msg)
	if mcp_server:
		mcp_server.stop_server()
		if mcp_server.start_server():
			msg = "Server restarted on port " + str(server_port)
			print("[Godot MCP] " + msg)
			_show_dialog("Server Restarted", msg)
		else:
			msg = "Failed to restart server"
			print("[Godot MCP] " + msg)
			_show_dialog("Restart Failed", msg)

func _stop_server():
	var msg = "Stopping server..."
	print("[Godot MCP] " + msg)
	if mcp_server:
		mcp_server.stop_server()
		msg = "Server stopped"
		print("[Godot MCP] " + msg)
		_show_dialog("Server Stopped", msg)

func _show_status():
	var status = "Godot MCP Plugin Status:\n"
	if mcp_server:
		status += "  Server: " + ("Running on port " + str(server_port) if mcp_server.is_server_running() else "Stopped") + "\n"
		status += "  Connections: " + str(mcp_server.get_connection_count()) + "\n"
	else:
		status += "  Server: Not initialized\n"
	
	print(status)
	_show_dialog("Plugin Status", status)