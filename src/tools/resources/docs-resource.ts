import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const docsResourceSchema = z.object({
  className: z.string().optional().describe('Godot class name to get documentation for (empty for index)'),
  includeInherited: z.boolean().default(true).describe('Include inherited members'),
  includeSignals: z.boolean().default(true).describe('Include signals'),
  includeConstants: z.boolean().default(true).describe('Include constants'),
  includeProperties: z.boolean().default(true).describe('Include properties'),
  includeMethods: z.boolean().default(true).describe('Include methods'),
  format: z.enum(['markdown', 'html', 'text']).default('markdown').describe('Output format'),
  maxDepth: z.number().min(1).max(5).default(3).describe('Maximum inheritance depth to show'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties')
});

export function createDocsResourceTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_docs_resource',
    name: 'Godot Documentation Resource',
    description: 'Get Godot class documentation as MCP resource (godot://docs/{class}).',
    category: 'resources',
    inputSchema: docsResourceSchema,
    handler: async (args: any) => {
      return handleDocsResource(args, transport);
    },
    readOnlyHint: true,
    destructiveHint: false,
idempotentHint: true
  };
}

async function handleDocsResource(
  args: z.infer<typeof docsResourceSchema>,
  _transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // This would typically fetch from Godot's documentation
    // For now, we'll generate a mock response or use a local cache
    
    let documentation = '';
    
    if (!args.className || args.className === '') {
      // Class index
      documentation = generateClassIndex();
    } else {
      // Specific class documentation
      documentation = generateClassDoc(args.className, args);
    }
    
    // Format the documentation
    let formattedDoc = documentation;
    if (args.format === 'html') {
      formattedDoc = convertToHTML(documentation);
    } else if (args.format === 'text') {
      formattedDoc = convertToPlainText(documentation);
    }
    
    return {
      content: [{
        type: 'text',
        text: formattedDoc
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching documentation: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

function generateClassIndex(): string {
  return `# Godot Class Index

## Core Classes
- **Node** - Base class for all scene objects
- **Object** - Base class for all engine classes
- **Resource** - Base class for all resources

## 2D
- **Node2D** - Base class for 2D nodes
- **Sprite2D** - 2D sprite node
- **TileMap** - Tile-based 2D map
- **Camera2D** - 2D camera

## 3D
- **Node3D** - Base class for 3D nodes
- **MeshInstance3D** - 3D mesh instance
- **Camera3D** - 3D camera
- **Light3D** - 3D light source

## UI
- **Control** - Base class for UI controls
- **Button** - Clickable button
- **Label** - Text label
- **LineEdit** - Single-line text input

## Audio
- **AudioStreamPlayer** - Audio playback
- **AudioStreamPlayer2D** - 2D spatial audio
- **AudioStreamPlayer3D** - 3D spatial audio

## Physics
- **RigidBody2D** - 2D physics body
- **RigidBody3D** - 3D physics body
- **CharacterBody2D** - 2D character controller
- **CharacterBody3D** - 3D character controller

## Animation
- **AnimationPlayer** - Animation playback
- **AnimationTree** - Advanced animation blending

## Networking
- **MultiplayerSynchronizer** - Network synchronization
- **MultiplayerSpawner** - Network object spawning

*Note: Full documentation would be fetched from Godot's official documentation.*`;
}

function generateClassDoc(className: string, _args: any): string {
  const classTemplates: Record<string, string> = {
    'Node': `# Node Class

Base class for all scene objects.

## Description
Node is the base class for all scene objects. A node can be a child of another node, forming a tree structure.

## Properties
- **name**: String - The node's name
- **owner**: Node - The node's owner
- **process_mode**: int - Processing mode

## Methods
- **add_child(node: Node)**: void - Add a child node
- **remove_child(node: Node)**: void - Remove a child node
- **get_node(path: String)**: Node - Get a node by path
- **queue_free()**: void - Queue the node for deletion

## Signals
- **ready()**: Emitted when the node is ready
- **tree_entered()**: Emitted when the node enters the scene tree
- **tree_exited()**: Emitted when the node exits the scene tree`,

    'Sprite2D': `# Sprite2D Class

2D sprite node.

## Description
A node that displays a 2D texture. Can be animated, flipped, and region-selected.

## Properties
- **texture**: Texture2D - The sprite's texture
- **region_enabled**: bool - Enable texture region
- **flip_h**: bool - Flip horizontally
- **flip_v**: bool - Flip vertically
- **centered**: bool - Center the sprite

## Methods
- **get_rect()**: Rect2 - Get the sprite's bounding rectangle
- **is_pixel_opaque(pos: Vector2)**: bool - Check if pixel is opaque

## Inherits From
- Node2D
- CanvasItem
- Node
- Object`,

    'Button': `# Button Class

Clickable button control.

## Description
A button that can be pressed to trigger an action.

## Properties
- **text**: String - The button's text
- **icon**: Texture2D - The button's icon
- **flat**: bool - Use flat style
- **toggle_mode**: bool - Toggle mode
- **pressed**: bool - Pressed state

## Methods
- **set_pressed_no_signal(pressed: bool)**: void - Set pressed without signal

## Signals
- **pressed()**: Emitted when the button is pressed
- **toggled(toggled_on: bool)**: Emitted when toggle state changes

## Inherits From
- BaseButton
- Control
- CanvasItem
- Node
- Object`
  };

  const template = classTemplates[className] || `# ${className} Class

Documentation for ${className} would be fetched from Godot's official documentation.

*Note: This is a placeholder. In a full implementation, documentation would be fetched from Godot's class reference.*`;

  return template;
}

function convertToHTML(markdown: string): string {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
}

function convertToPlainText(markdown: string): string {
  // Simple markdown to plain text conversion
  return markdown
    .replace(/^# (.*$)/gm, '$1\n' + '='.repeat('$1'.length) + '\n')
    .replace(/^## (.*$)/gm, '$1\n' + '-'.repeat('$1'.length) + '\n')
    .replace(/^### (.*$)/gm, '$1:\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^- (.*$)/gm, '• $1')
    .replace(/\n{3,}/g, '\n\n');
}