// Test sending a ping message to the Godot addon
const WebSocket = require('ws');

const EDITOR_PORT = process.env.GODOT_EDITOR_PORT || 13337;

async function testPing() {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${EDITOR_PORT}`);
    
    ws.onopen = () => {
      console.log('Connected to Godot editor WebSocket server');
      
      // Send a ping message
      const pingMessage = JSON.stringify({
        operation: 'ping',
        id: 'test-123'
      });
      
      console.log('Sending ping message:', pingMessage);
      ws.send(pingMessage);
    };
    
    ws.onmessage = (event) => {
      console.log('Received response (raw):', event.data);
      
      let responseText;
      if (Buffer.isBuffer(event.data)) {
        // Handle Buffer
        responseText = event.data.toString('utf8');
      } else if (event.data instanceof ArrayBuffer) {
        // Handle ArrayBuffer
        responseText = Buffer.from(event.data).toString('utf8');
      } else {
        // Handle string
        responseText = event.data.toString();
      }
      
      console.log('Received response (decoded):', responseText);
      
      try {
        const response = JSON.parse(responseText);
        
        if (response.success && response.data && response.data.message === 'pong') {
          console.log('✅ Ping test PASSED - Godot addon responded with pong');
          ws.close();
          resolve(true);
        } else {
          console.log('❌ Ping test FAILED - Unexpected response');
          console.log('Response:', response);
          ws.close();
          resolve(false);
        }
      } catch (error) {
        console.log('❌ Ping test FAILED - Could not parse JSON response');
        console.log('Error:', error.message);
        console.log('Response text:', responseText);
        ws.close();
        resolve(false);
      }
    };
    
    ws.onerror = (error) => {
      console.log('WebSocket error:', error.message);
      resolve(false);
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('❌ Ping test TIMEOUT - No response received');
      ws.close();
      resolve(false);
    }, 5000);
  });
}

async function main() {
  console.log('Testing Godot MCP addon communication...');
  console.log('');
  
  const result = await testPing();
  
  console.log('');
  if (result) {
    console.log('✅ SUCCESS: The Godot MCP addon is working correctly!');
    console.log('The MCP server should be able to communicate with Godot.');
  } else {
    console.log('❌ FAILED: Could not communicate with Godot MCP addon');
  }
}

main().catch(console.error);