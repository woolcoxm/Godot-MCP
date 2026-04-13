// Simple test to check if the Godot addon WebSocket server is running
const WebSocket = require('ws');

const EDITOR_PORT = process.env.GODOT_EDITOR_PORT || 13337;
const RUNTIME_PORT = process.env.GODOT_RUNTIME_PORT || 13338;

async function testConnection(port, mode) {
  return new Promise((resolve) => {
    let connected = false;
    let timeoutFired = false;
    
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    ws.onopen = () => {
      if (!timeoutFired) {
        console.log(`✓ Connected to ${mode} WebSocket server on port ${port}`);
        connected = true;
        ws.close();
        resolve(true);
      }
    };
    
    ws.onerror = (error) => {
      if (!timeoutFired && !connected) {
        console.log(`✗ Failed to connect to ${mode} WebSocket server on port ${port}:`, error.message || 'Unknown error');
        resolve(false);
      }
    };
    
    // Timeout after 2 seconds
    setTimeout(() => {
      timeoutFired = true;
      if (!connected) {
        console.log(`✗ Timeout connecting to ${mode} WebSocket server on port ${port}`);
        ws.close();
        resolve(false);
      }
    }, 2000);
  });
}

async function main() {
  console.log('Testing Godot MCP connections...');
  console.log('Make sure Godot editor is running with the MCP addon enabled!');
  console.log('');
  
  const editorConnected = await testConnection(EDITOR_PORT, 'editor');
  const runtimeConnected = await testConnection(RUNTIME_PORT, 'runtime');
  
  console.log('');
  if (editorConnected) {
    console.log('✅ Editor connection test PASSED');
    console.log('The MCP server should be able to connect to the Godot editor.');
  } else if (runtimeConnected) {
    console.log('✅ Runtime connection test PASSED');
    console.log('The MCP server should be able to connect to a running Godot game.');
  } else {
    console.log('❌ Both connection tests FAILED');
    console.log('');
    console.log('Troubleshooting steps:');
    console.log('1. Make sure Godot editor is running');
    console.log('2. Make sure the Godot MCP addon is enabled (check Editor -> Plugins)');
    console.log('3. Check that the addon loaded without errors');
    console.log('4. Try restarting the Godot editor');
    console.log('');
    console.log('If the addon is enabled, you should see "[Godot MCP] Plugin loading..." in the Godot output console');
  }
}

main().catch(console.error);