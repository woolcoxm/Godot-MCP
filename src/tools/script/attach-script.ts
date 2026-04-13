import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';
import { SceneParser } from '../../utils/scene-parser.js';

const attachScriptSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to attach/detach script from'),
  scriptPath: z.string().optional().describe('Path to the script file to attach (omit to detach)'),
  createIfMissing: z.boolean().default(false).describe('Create script file if it does not exist'),
  scriptTemplate: z.enum(['empty', 'node', 'node2d', 'node3d', 'control', 'character_body_2d', 'character_body_3d', 'area_2d', 'area_3d'])
    .default('empty')
    .describe('Template to use when creating a new script'),
});

const detachScriptSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to detach script from'),
});

const getNodeScriptSchema = z.object({
  scenePath: z.string().describe('Path to the scene file'),
  nodePath: z.string().describe('Path to the node to get script for'),
});

// Script templates
const scriptTemplates: Record<string, string> = {
  empty: `extends %BASE_CLASS%

# Called when the node enters the scene tree for the first time.
func _ready():
	pass # Replace with function body.

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass
`,

  node: `extends Node

# Called when the node enters the scene tree for the first time.
func _ready():
	pass # Replace with function body.

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass
`,

  node2d: `extends Node2D

# Called when the node enters the scene tree for the first time.
func _ready():
	pass # Replace with function body.

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass

# Called every physics frame. 'delta' is the elapsed time since the previous frame.
func _physics_process(delta):
	pass
`,

  node3d: `extends Node3D

# Called when the node enters the scene tree for the first time.
func _ready():
	pass # Replace with function body.

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass

# Called every physics frame. 'delta' is the elapsed time since the previous frame.
func _physics_process(delta):
	pass
`,

  control: `extends Control

# Called when the node enters the scene tree for the first time.
func _ready():
	pass # Replace with function body.

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass

func _gui_input(event):
	if event is InputEventMouseButton and event.pressed:
		# Handle mouse click
		pass
`,

  character_body_2d: `extends CharacterBody2D

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0

# Get the gravity from the project settings to be synced with RigidBody nodes.
var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta):
	# Add the gravity.
	if not is_on_floor():
		velocity.y += gravity * delta

	# Handle Jump.
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = jump_velocity

	# Get the input direction and handle the movement/deceleration.
	var direction = Input.get_axis("ui_left", "ui_right")
	if direction:
		velocity.x = direction * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)

	move_and_slide()
`,

  character_body_3d: `extends CharacterBody3D

@export var speed: float = 5.0
@export var jump_velocity: float = 4.5

# Get the gravity from the project settings to be synced with RigidBody nodes.
var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

func _physics_process(delta):
	# Add the gravity.
	if not is_on_floor():
		velocity.y -= gravity * delta

	# Handle Jump.
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = jump_velocity

	# Get the input direction and handle the movement/deceleration.
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	if direction:
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)
		velocity.z = move_toward(velocity.z, 0, speed)

	move_and_slide()
`,

  area_2d: `extends Area2D

signal body_entered(body: Node2D)
signal body_exited(body: Node2D)

# Called when the node enters the scene tree for the first time.
func _ready():
	pass # Replace with function body.

func _on_body_entered(body: Node2D):
	body_entered.emit(body)

func _on_body_exited(body: Node2D):
	body_exited.emit(body)
`,

  area_3d: `extends Area3D

signal body_entered(body: Node3D)
signal body_exited(body: Node3D)

# Called when the node enters the scene tree for the first time.
func _ready():
	pass # Replace with function body.

func _on_body_entered(body: Node3D):
	body_entered.emit(body)

func _on_body_exited(body: Node3D):
	body_exited.emit(body)
`,
};

export function createAttachScriptTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_attach_script',
    name: 'Attach Script to Node',
    description: 'Attach a GDScript to a node, creating the script if needed',
    category: 'script',
    inputSchema: attachScriptSchema,
    handler: async (args) => {
      // Read the scene first
      const readSceneOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readSceneResult = await transport.execute(readSceneOperation);
      
      if (!readSceneResult.success) {
        throw new Error(`Failed to read scene: ${readSceneResult.error}`);
      }

      if (!readSceneResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      const sceneInfo = SceneParser.parseScene(readSceneResult.data.content);
      
      // Find the node
      const node = SceneParser.findNodeByPath(sceneInfo, args.nodePath);
      if (!node) {
        throw new Error(`Node not found: ${args.nodePath}`);
      }

      // Check if script path is provided
      if (!args.scriptPath) {
        throw new Error('Script path is required for attachment');
      }

      let scriptContent = '';
      let scriptCreated = false;

      // Check if script file exists
      const checkScriptOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: args.scriptPath },
      };
      
      const checkScriptResult = await transport.execute(checkScriptOperation);
      
      if (!checkScriptResult.success || !checkScriptResult.data?.content) {
        // Script doesn't exist or can't be read
        if (args.createIfMissing) {
          // Determine base class from node type
          let baseClass = 'Node';
          if (node.type.endsWith('2D')) {
            baseClass = 'Node2D';
          } else if (node.type.endsWith('3D')) {
            baseClass = 'Node3D';
          } else if (node.type.includes('Control')) {
            baseClass = 'Control';
          } else if (node.type.includes('CharacterBody2D')) {
            baseClass = 'CharacterBody2D';
          } else if (node.type.includes('CharacterBody3D')) {
            baseClass = 'CharacterBody3D';
          } else if (node.type.includes('Area2D')) {
            baseClass = 'Area2D';
          } else if (node.type.includes('Area3D')) {
            baseClass = 'Area3D';
          }

          // Get template and replace base class placeholder
          const template = scriptTemplates[args.scriptTemplate] || scriptTemplates.empty;
          scriptContent = template.replace('%BASE_CLASS%', baseClass);

          // Create the script file
          const createScriptOperation: TransportOperation = {
            operation: 'write_file',
            params: {
              path: args.scriptPath,
              content: scriptContent,
            },
          };
          
          const createScriptResult = await transport.execute(createScriptOperation);
          
          if (!createScriptResult.success) {
            throw new Error(`Failed to create script file: ${createScriptResult.error}`);
          }
          
          scriptCreated = true;
        } else {
          throw new Error(`Script file not found: ${args.scriptPath}. Set createIfMissing to true to create it.`);
        }
      } else {
        scriptContent = checkScriptResult.data.content;
      }

      // Update node's script property
      node.script = { path: args.scriptPath };

      // Serialize and save the scene
      const updatedSceneContent = SceneParser.serializeScene(sceneInfo);
      
      const writeSceneOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.scenePath,
          content: updatedSceneContent,
        },
      };

      const writeSceneResult = await transport.execute(writeSceneOperation);
      
      if (!writeSceneResult.success) {
        throw new Error(`Failed to save scene: ${writeSceneResult.error}`);
      }

      return {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        scriptPath: args.scriptPath,
        scriptCreated,
        scriptTemplate: scriptCreated ? args.scriptTemplate : undefined,
        message: scriptCreated 
          ? `Created and attached script ${args.scriptPath} to node ${args.nodePath}`
          : `Attached existing script ${args.scriptPath} to node ${args.nodePath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createDetachScriptTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_detach_script',
    name: 'Detach Script from Node',
    description: 'Remove a script attachment from a node',
    category: 'script',
    inputSchema: detachScriptSchema,
    handler: async (args) => {
      // Read the scene
      const readSceneOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readSceneResult = await transport.execute(readSceneOperation);
      
      if (!readSceneResult.success) {
        throw new Error(`Failed to read scene: ${readSceneResult.error}`);
      }

      if (!readSceneResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      const sceneInfo = SceneParser.parseScene(readSceneResult.data.content);
      
      // Find the node
      const node = SceneParser.findNodeByPath(sceneInfo, args.nodePath);
      if (!node) {
        throw new Error(`Node not found: ${args.nodePath}`);
      }

      // Check if node has a script
      if (!node.script) {
        return {
          scenePath: args.scenePath,
          nodePath: args.nodePath,
          message: `Node ${args.nodePath} has no script attached`,
          readOnlyHint: false,
        };
      }

      const oldScriptPath = node.script.path;
      
      // Remove script reference
      delete node.script;

      // Serialize and save the scene
      const updatedSceneContent = SceneParser.serializeScene(sceneInfo);
      
      const writeSceneOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.scenePath,
          content: updatedSceneContent,
        },
      };

      const writeSceneResult = await transport.execute(writeSceneOperation);
      
      if (!writeSceneResult.success) {
        throw new Error(`Failed to save scene: ${writeSceneResult.error}`);
      }

      return {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        detachedScriptPath: oldScriptPath,
        message: `Detached script ${oldScriptPath} from node ${args.nodePath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createGetNodeScriptTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_get_node_script',
    name: 'Get Node Script',
    description: 'Get information about the script attached to a node',
    category: 'script',
    inputSchema: getNodeScriptSchema,
    handler: async (args) => {
      // Read the scene
      const readSceneOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readSceneResult = await transport.execute(readSceneOperation);
      
      if (!readSceneResult.success) {
        throw new Error(`Failed to read scene: ${readSceneResult.error}`);
      }

      if (!readSceneResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      const sceneInfo = SceneParser.parseScene(readSceneResult.data.content);
      
      // Find the node
      const node = SceneParser.findNodeByPath(sceneInfo, args.nodePath);
      if (!node) {
        throw new Error(`Node not found: ${args.nodePath}`);
      }

      // Check if node has a script
      if (!node.script) {
        return {
          scenePath: args.scenePath,
          nodePath: args.nodePath,
          hasScript: false,
          message: `Node ${args.nodePath} has no script attached`,
          readOnlyHint: true,
        };
      }

      const scriptPath = node.script.path;
      
      // Try to read the script content
      const readScriptOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: scriptPath },
      };
      
      const readScriptResult = await transport.execute(readScriptOperation);
      
      let scriptContent = '';
      let scriptExists = false;
      
      if (readScriptResult.success && readScriptResult.data?.content) {
        scriptContent = readScriptResult.data.content;
        scriptExists = true;
      }

      return {
        scenePath: args.scenePath,
        nodePath: args.nodePath,
        hasScript: true,
        scriptPath,
        scriptExists,
        scriptContent: scriptExists ? scriptContent : undefined,
        scriptError: !scriptExists ? `Script file not found or cannot be read: ${scriptPath}` : undefined,
        message: scriptExists 
          ? `Node ${args.nodePath} has script ${scriptPath} (${scriptContent.length} bytes)`
          : `Node ${args.nodePath} references script ${scriptPath} but file not found`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}