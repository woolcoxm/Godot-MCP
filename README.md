# Godot MCP Server

A Model Context Protocol (MCP) server for interacting with Godot Engine. This server provides tools for creating, modifying, and managing Godot projects through three communication channels:

1. **Headless CLI** - For project scaffolding, file operations, scene creation (no editor required)
2. **Editor Plugin** - For live editor interaction when Godot editor is running (WebSocket :13337)
3. **Runtime Autoload** - For controlling a running game (WebSocket :13338)

## Features

- **149+ tools** across 14 categories
- **Category-based discovery** with pagination
- **Bidirectional type conversion** between TypeScript and Godot types
- **Graceful degradation** - tools work even when editor/runtime aren't available
- **Safe operations** with readOnlyHint, destructiveHint, and idempotentHint annotations

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