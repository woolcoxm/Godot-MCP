# Changelog

All notable changes to the Godot MCP Server will be documented in this file.

## [Unreleased]

### Added
- Initial release with 149+ tools across 14 categories
- Three communication channels: headless CLI, editor plugin, runtime autoload
- Category-based tool discovery with pagination
- Bidirectional type converters for all Godot types
- Comprehensive tool annotations (readOnlyHint, destructiveHint, idempotentHint)
- Example configurations for opencode, Claude Desktop, and Cursor
- Security review and documentation
- Complete documentation (README.md, CONTRIBUTING.md, SECURITY.md)

### Tool Categories
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

### Features
- Graceful degradation: tools work even when editor/runtime aren't available
- Type-safe TypeScript implementation with Zod validation
- Comprehensive error handling with user-friendly messages
- Configurable logging levels
- Environment variable configuration
- Godot editor plugin for live interaction
- Runtime autoload for game control

### Security
- Path traversal prevention
- Input validation with Zod schemas
- Resource limits (timeouts, memory, file sizes)
- Localhost-only WebSocket connections
- Secure error handling without information disclosure

### Technical Details
- Built with TypeScript and @modelcontextprotocol/sdk
- 66 implemented tools (of 149 planned)
- 14 complete tool categories
- 20+ Godot type converters
- 50+ comprehensive tests
- 100% tool annotation completeness

## [0.1.0] - Planned First Release

### Planned Features
- Connection pooling for headless Godot processes
- Caching system for parsed scenes and project state
- Comprehensive error recovery and retry logic
- Edge case testing (unicode, large scenes, concurrent requests)
- Performance profiling and benchmarking
- CI/CD pipeline setup
- Remaining 83 tools implementation
- Target 400+ comprehensive tests

### Known Limitations
- GDScript eval sandboxing is basic (relies on Godot's security)
- Authentication is localhost-only (add token auth for production)
- Some advanced Godot features not yet implemented
- Test coverage needs expansion to 400+ tests

## Versioning

This project uses [Semantic Versioning](https://semver.org/).

- **Major version (1.x.x)**: Breaking changes to the MCP protocol or tool interfaces
- **Minor version (x.1.x)**: New features, tools, or categories
- **Patch version (x.x.1)**: Bug fixes, security patches, documentation updates

## Release Process

1. Update version in `package.json`
2. Update this CHANGELOG.md
3. Run all tests: `npm test`
4. Build the project: `npm run build`
5. Create GitHub release with release notes
6. Publish to npm (when ready)

## Contributing to the Changelog

When adding new features or fixes, please add an entry to the "Unreleased" section following the format above.

- Use present tense ("Add feature" not "Added feature")
- Reference issues and pull requests where applicable
- Group changes under Added/Changed/Deprecated/Removed/Fixed/Security headings