# Contributing to Godot MCP Server

Thank you for your interest in contributing to the Godot MCP Server! This document provides guidelines and instructions for contributing.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/godot-mcp.git
   cd godot-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
godot-mcp/
├── src/
│   ├── index.ts              # Entry point with stdio transport
│   ├── server.ts             # MCP server setup
│   ├── config.ts             # Environment configuration
│   ├── types/
│   │   └── godot.ts          # TypeScript interfaces for Godot types
│   ├── utils/
│   │   ├── logger.ts         # Logger utility
│   │   ├── godot-types.ts    # Bidirectional type converters
│   │   ├── scene-parser.ts   # .tscn file parser
│   │   └── script-generator.ts # GDScript generation helpers
│   ├── transports/
│   │   ├── transport.ts      # Unified transport system
│   │   ├── headless-bridge.ts # Bridge to godot --headless
│   │   ├── editor-bridge.ts  # WebSocket client to editor (:13337)
│   │   └── runtime-bridge.ts # WebSocket client to runtime (:13338)
│   └── tools/
│       ├── registry.ts       # Tool registry with discovery
│       ├── categories.ts     # 14 tool category definitions
│       ├── register-tools.ts # Main tool registration
│       └── [category]/       # Tool implementations by category
│           ├── project/
│           ├── scene/
│           ├── node/
│           ├── script/
│           ├── assets/
│           ├── 3d/
│           ├── 2d/
│           ├── animation/
│           ├── runtime/
│           ├── ui/
│           ├── audio/
│           ├── networking/
│           ├── build/
│           └── resources/
├── godot_plugin/             # Godot editor plugin
│   └── addons/godot_mcp/
│       ├── plugin.cfg
│       ├── plugin.gd
│       ├── mcp_server.gd
│       ├── scene_ops.gd
│       ├── node_ops.gd
│       ├── script_ops.gd
│       ├── editor_ops.gd
│       ├── mcp_autoload.gd
│       └── runtime_ops.gd
├── tests/                    # Test files
├── examples/                 # Example configurations
└── workflow.md              # Development workflow and progress tracking
```

## Adding New Tools

### 1. Create Tool File

Create a new TypeScript file in the appropriate category directory (e.g., `src/tools/ui/` for UI tools):

```typescript
import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport } from '../../transports/transport.js';

const myToolSchema = z.object({
  // Define input parameters with Zod
  parentPath: z.string().default('.').describe('Path to parent node'),
  name: z.string().optional().describe('Name for the node'),
  // Add more parameters as needed
});

export function createMyTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_my_tool', // Unique ID (prefix with 'godot_')
    name: 'My Tool Name', // Human-readable name
    description: 'Brief description of what the tool does.',
    category: 'category_name', // One of the 14 categories
    inputSchema: myToolSchema,
    handler: async (args: any) => {
      return handleMyTool(args, transport);
    },
    readOnlyHint: false,    // true if tool only reads data
    destructiveHint: true,  // true if tool modifies/deletes data
    idempotentHint: false   // true if tool can be safely repeated
  };
}

async function handleMyTool(
  args: z.infer<typeof myToolSchema>,
  transport: Transport
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Implement tool logic here
    const result = await transport.execute({
      operation: 'some_operation',
      params: {
        // Map args to operation parameters
      }
    });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `Failed: ${result.error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Success: ${JSON.stringify(result.data)}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}
```

### 2. Register the Tool

Add the tool to `src/tools/register-tools.ts`:

```typescript
// Import the tool
import { createMyTool } from './category/my-tool.js';

// In registerAllTools function:
registry.registerTool(createMyTool(transport));
```

### 3. Update Category Count

Update the tool count in `src/tools/categories.ts` for the appropriate category.

### 4. Add Tests

Create or update test files in `tests/` to cover the new tool.

## Tool Design Guidelines

### Naming Conventions

- Tool IDs: `godot_[verb]_[noun]` (e.g., `godot_create_scene`, `godot_modify_node`)
- Use present tense for tool names: "Create Scene", "Modify Node"
- Be descriptive but concise in tool descriptions

### Schema Design

- Use Zod for schema validation
- Provide default values where appropriate
- Add `.describe()` for parameter documentation
- Use enums for limited options
- Validate ranges for numeric parameters

### Error Handling

- Always wrap tool logic in try-catch blocks
- Return user-friendly error messages
- Include the original error for debugging
- Use the transport's success/error response format

### Tool Annotations

- `readOnlyHint: true` - Tool only reads data, doesn't modify
- `destructiveHint: true` - Tool modifies or deletes data
- `idempotentHint: true` - Tool can be safely repeated with same result

### Type Conversion

- Use `GodotTypeConverter` for converting between TypeScript and Godot types
- Handle all Godot types (Vector2, Color, Transform3D, etc.)
- Validate type conversions with tests

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/my-test.test.ts

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

- Test tool schemas with valid and invalid inputs
- Test tool execution with mock transports
- Test error handling
- Test type conversions
- Aim for high test coverage

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { createMyTool } from '../src/tools/category/my-tool.js';

describe('My Tool', () => {
  const mockTransport = {
    execute: async () => ({ success: true, data: {} })
  };

  it('should have correct metadata', () => {
    const tool = createMyTool(mockTransport as any);
    expect(tool.id).toBe('godot_my_tool');
    expect(tool.category).toBe('category_name');
  });

  it('should validate schema', () => {
    const tool = createMyTool(mockTransport as any);
    const validInput = { /* valid parameters */ };
    tool.inputSchema.parse(validInput); // Should not throw
  });

  it('should execute without error', async () => {
    const tool = createMyTool(mockTransport as any);
    const result = await tool.handler({ /* parameters */ });
    expect(result).toHaveProperty('content');
  });
});
```

## Godot Plugin Development

The Godot plugin is located in `godot_plugin/addons/godot_mcp/`. When adding new operations:

1. Update the appropriate GDScript file (e.g., `scene_ops.gd` for scene operations)
2. Add the operation to the WebSocket server in `mcp_server.gd`
3. Test the operation in both headless and editor modes

## Code Style

- Use TypeScript with strict type checking
- Follow existing code patterns and conventions
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add or update tests
5. Run tests to ensure they pass
6. Update documentation if needed
7. Submit a pull request

### PR Checklist

- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Code follows project style
- [ ] Tool annotations (readOnlyHint, destructiveHint, idempotentHint) set correctly
- [ ] Type conversions handled properly
- [ ] No breaking changes to existing tools

## Reporting Issues

When reporting issues, please include:

1. Description of the problem
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Environment details (OS, Godot version, Node.js version)
6. Error messages or logs

## License

By contributing, you agree that your contributions will be licensed under the project's ISC license.