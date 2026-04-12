import { GodotMCPServer } from './server.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('Starting Godot MCP Server...');
    
    const server = new GodotMCPServer();
    
    const shutdown = async () => {
      logger.info('Shutting down Godot MCP Server...');
      await server.stop();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    await server.start();
    
    logger.info('Godot MCP Server is ready');
  } catch (error) {
    logger.error('Failed to start Godot MCP Server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { GodotMCPServer } from './server.js';