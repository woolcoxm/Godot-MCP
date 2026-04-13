const { spawn } = require('child_process');

const child = spawn('node', ['dist/index.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let allStdout = '';
child.stdout.on('data', d => { allStdout += d.toString(); });

const initMsg = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' }
  }
}) + '\n';

// Wait a bit for server to start, then send init
setTimeout(() => {
  child.stdin.write(initMsg);
  
  // Wait for response
  setTimeout(() => {
    const lines = allStdout.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      console.log('FAIL: No stdout response');
    } else {
      let success = true;
      lines.forEach((line, i) => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.result) {
            console.log('PASS: Init response received');
            console.log('  Server:', parsed.result?.serverInfo?.name, parsed.result?.serverInfo?.version);
          } else {
            console.log('Line', i+1, ':', JSON.stringify(parsed).substring(0, 200));
          }
        } catch(e) {
          console.log('FAIL: Invalid JSON on line', i+1);
          console.log('  Content:', line.substring(0, 200));
          success = false;
        }
      });
      if (success && lines.length > 0) {
        console.log('PASS: All stdout lines are valid JSON-RPC');
      }
    }
    child.kill();
    process.exit(0);
  }, 5000);
}, 2000);
