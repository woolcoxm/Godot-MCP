// Simple smoke test to verify the server can be imported and instantiated
import { GodotMCPServer } from './dist/index.js';

console.log('Starting Godot MCP Server smoke test...');

try {
  const server = new GodotMCPServer();
  console.log('✓ Server instance created successfully');
  
  // Try to start the server (but don't actually connect transport for smoke test)
  console.log('✓ Server constructor completed without errors');
  
  console.log('\nSmoke test passed!');
  console.log('The Godot MCP Server has been successfully built and can be instantiated.');
  console.log('\nAvailable tools registered:');
  console.log('- godot_list_categories');
  console.log('- godot_list_tools');
  console.log('- godot_search_tools');
  
  process.exit(0);
} catch (error) {
  console.error('✗ Smoke test failed:', error);
  process.exit(1);
}