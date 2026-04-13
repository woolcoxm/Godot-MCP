# Godot MCP Server

A Model Context Protocol (MCP) server for interacting with Godot Engine. This server provides tools for creating, modifying, and managing Godot projects through three communication channels:

1. **Headless CLI** - For project scaffolding, file operations, scene creation (no editor required)
2. **Editor Plugin** - For live editor interaction when Godot editor is running (WebSocket :13337)
3. **Runtime Autoload** - For controlling a running game (WebSocket :13338)

## Features

- **149+ tools** across 14 categories with complete coverage of Godot Engine capabilities
- **Category-based discovery** with pagination and search
- **Bidirectional type conversion** between TypeScript and Godot types (Vector2, Color, Transform3D, etc.)
- **Graceful degradation** - tools work even when editor/runtime aren't available
- **Safe operations** with readOnlyHint, destructiveHint, and idempotentHint annotations
- **Three communication channels**: headless CLI, editor plugin, runtime autoload
- **Comprehensive tool coverage**: 2D, 3D, UI, animation, audio, networking, build tools, and more

## Installation

```bash
npm install
npm run build
```

## Configuration

Set environment variables:
- `GODOT_PATH`: Path to Godot executable (default: "godot")
- `GODOT_EDITOR_PORT`: Editor WebSocket port (default: 13337)
- `GODOT_RUNTIME_PORT`: Runtime WebSocket port (default: 13338)
- `GODOT_LOG_LEVEL`: Log level (debug, info, warn, error) (default: info)

## Usage

### With opencode

Add to your `opencode.json`:

```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/path/to/godot-mcp/dist/index.js"],
      "env": {
        "GODOT_PATH": "/path/to/godot"
      }
    }
  }
}
```

### Tool Discovery

Before using specific tools, use the discovery tools:

1. `godot_list_categories` - List all available tool categories
2. `godot_list_tools` - List tools within a category (paginated)
3. `godot_search_tools` - Search tools by keyword across all categories

### Tool Categories

The server provides tools across 14 categories:

1. **Project** - Project creation, settings, input maps, export presets
2. **Scene** - Scene CRUD operations, scene tree inspection
3. **Node** - Node creation, modification, deletion, properties
4. **Script** - GDScript creation, reading, modification, analysis
5. **Assets** - Asset import, material/shader/texture generation
6. **3D** - Complete 3D world building (CSG, meshes, lighting, physics, cameras, etc.)
7. **2D** - Complete 2D game development (tilemaps, sprites, physics, parallax, etc.)
8. **Animation** - Animation players, trees, tweening, blend spaces
9. **Runtime** - Game control, eval, input simulation, screenshots, debug info
10. **UI** - Controls, themes, layouts, popups, trees, tabs, text/range controls
11. **Audio** - Audio players, buses, effects, spatial audio, streaming
12. **Networking** - HTTP requests, WebSockets, multiplayer, RPC/packet tools
13. **Build** - Export presets, project building for multiple platforms
14. **Resources** - MCP resources for scripts, scenes, projects, documentation

### Example Workflows

#### Create a 2D Platformer
```json
{
  "operation": "godot_create_project",
  "params": {
    "name": "PlatformerGame",
    "path": "C:/Games/Platformer"
  }
}
```

#### Create a Player Character
```json
{
  "operation": "godot_create_node",
  "params": {
    "parentPath": ".",
    "nodeType": "CharacterBody2D",
    "name": "Player",
    "properties": {
      "position": { "x": 100, "y": 300 }
    }
  }
}
```

#### Add a Sprite
```json
{
  "operation": "godot_create_sprite2d",
  "params": {
    "parentPath": "./Player",
    "texturePath": "res://assets/player.png",
    "name": "Sprite"
  }
}
```

#### Create UI Controls
```json
{
  "operation": "godot_create_control",
  "params": {
    "parentPath": ".",
    "controlType": "Label",
    "name": "ScoreLabel",
    "text": "Score: 0",
    "position": { "x": 20, "y": 20 }
  }
}
```

#### Export the Game
```json
{
  "operation": "godot_export_project",
  "params": {
    "presetName": "Windows Release",
    "platform": "Windows Desktop",
    "exportPath": "build/PlatformerGame.exe"
  }
}
```

## Architecture

```
opencode / AI Client
        │
        │  MCP (stdio)
        ▼
┌──────────────────────────────┐
│  TypeScript MCP Server       │
│  @modelcontextprotocol/sdk   │
│                              │
│  ├── Tool Router             │
│  │   ├── Category Registry   │
│  │   └── Pagination Engine   │
│  │                           │
│  ├── Headless Bridge         │──── godot --headless --script
│  │   (project creation,      │     (no editor needed)
│  │    file I/O, scenes,      │
│  │    project config)        │
│  │                           │
│  ├── Editor Plugin Bridge    │──── WebSocket :13337
│  │   (live scene tree,       │     (when editor is open)
│  │    script editing,        │
│  │    editor state)          │
│  │                           │
│  └── Runtime Bridge          │──── WebSocket :13338
│      (running game control,  │     (autoload in game)
│       eval, input, debug)    │
└──────────────────────────────┘
```

## Development

```bash
# Build
npm run build

# Development watch mode
npm run dev

# Run tests
npm test

# Type check
npm run lint
```

## License

ISC