@tool
extends EditorPlugin

var mcp_server = null
var server_port = 13337

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
	
	print("[Godot MCP] Plugin unloaded")

func _restart_server():
	print("[Godot MCP] Restarting server...")
	if mcp_server:
		mcp_server.stop_server()
		if mcp_server.start_server():
			print("[Godot MCP] Server restarted on port ", server_port)
		else:
			print("[Godot MCP] Failed to restart server")

func _stop_server():
	print("[Godot MCP] Stopping server...")
	if mcp_server:
		mcp_server.stop_server()
		print("[Godot MCP] Server stopped")

func _show_status():
	var status = "Godot MCP Plugin Status:\n"
	if mcp_server:
		status += "  Server: " + ("Running on port " + str(server_port) if mcp_server.is_server_running() else "Stopped") + "\n"
		status += "  Connections: " + str(mcp_server.get_connection_count()) + "\n"
	else:
		status += "  Server: Not initialized\n"
	
	print(status)

	var dialog = AcceptDialog.new()
	dialog.title = "Godot MCP Status"
	dialog.dialog_text = status

	# Prevent memory leaks by freeing the dialog when closed
	dialog.confirmed.connect(dialog.queue_free)
	dialog.canceled.connect(dialog.queue_free)

	get_editor_interface().get_base_control().add_child(dialog)
	dialog.popup_centered()