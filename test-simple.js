// Simple test mimicking the editor-bridge.ts behavior
const WebSocket = require('ws');

const EDITOR_PORT = process.env.GODOT_EDITOR_PORT || 13337;

// Create WebSocket connection like editor-bridge.ts does
const ws = new WebSocket(`ws://localhost:${EDITOR_PORT}`);

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Send a message like editor-bridge.ts does
  const message = {
    operation: 'ping',
    id: '1'
  };
  
  console.log('Sending:', JSON.stringify(message));
  ws.send(JSON.stringify(message));
};

ws.onmessage = (event) => {
  console.log('Raw data type:', typeof event.data);
  console.log('Is Buffer?', Buffer.isBuffer(event.data));
  console.log('Is ArrayBuffer?', event.data instanceof ArrayBuffer);
  
  let data;
  if (Buffer.isBuffer(event.data)) {
    data = event.data.toString('utf8');
  } else if (event.data instanceof ArrayBuffer) {
    data = Buffer.from(event.data).toString('utf8');
  } else {
    data = event.data.toString();
  }
  
  console.log('Received data (string):', data);
  
  try {
    const parsed = JSON.parse(data);
    console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('Could not parse as JSON');
    console.log('Hex dump:', Buffer.from(data).toString('hex'));
  }
  
  ws.close();
};

ws.onerror = (error) => {
  console.log('WebSocket error:', error.message);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};

// Timeout after 3 seconds
setTimeout(() => {
  console.log('Timeout');
  ws.close();
  process.exit(0);
}, 3000);