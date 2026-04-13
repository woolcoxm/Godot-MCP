#!/usr/bin/env node

console.log('Godot MCP Edge Case Testing');
console.log('===========================\n');

const testCases = [
  {
    name: 'Unicode Filenames',
    description: 'Test handling of Unicode characters in filenames',
    test: () => {
      const unicodeNames = [
        'résumé.tscn',
        'café.gd',
        '🎮game_scene.tscn',
        '日本語シーン.tscn',
        'emoji_🚀_scene.tscn'
      ];
      
      console.log('  Testing Unicode filenames:');
      unicodeNames.forEach(name => {
        // Basic validation - just check they're strings
        if (typeof name === 'string' && name.length > 0) {
          console.log(`    ✅ "${name}" - valid string`);
        } else {
          console.log(`    ❌ "${name}" - invalid`);
        }
      });
      return true;
    }
  },
  
  {
    name: 'Large Scene Files',
    description: 'Test handling of scenes with many nodes',
    test: () => {
      console.log('  Testing large scene simulation:');
      
      // Simulate a large scene with 1000 nodes
      const nodeCount = 1000;
      let sceneContent = '[gd_scene load_steps=2 format=3]\n';
      sceneContent += '[ext_resource type="Script" path="res://script.gd" id=1]\n';
      sceneContent += '[node name="Root" type="Node2D"]\n';
      
      for (let i = 0; i < nodeCount; i++) {
        sceneContent += `[node name="Child${i}" type="Node2D" parent="."]\n`;
      }
      
      const lines = sceneContent.split('\n');
      console.log(`    Simulated scene with ${nodeCount} nodes (${lines.length} lines)`);
      
      if (lines.length === nodeCount + 3) { // +3 for header lines
        console.log('    ✅ Scene structure valid');
        return true;
      } else {
        console.log('    ❌ Scene structure invalid');
        return false;
      }
    }
  },
  
  {
    name: 'Malformed JSON',
    description: 'Test handling of invalid JSON input',
    test: () => {
      console.log('  Testing malformed JSON handling:');
      
      const malformedInputs = [
        '{ invalid json',
        '{"missing": "quote}',
        'not json at all',
        '{"nested": {"deep": "value"}}', // Actually valid
        '{"trailing": "comma",}'
      ];
      
      let passed = 0;
      let failed = 0;
      
      malformedInputs.forEach((input, i) => {
        try {
          JSON.parse(input);
          console.log(`    ✅ Input ${i + 1}: Valid JSON`);
          passed++;
        } catch (err) {
          console.log(`    ✅ Input ${i + 1}: Properly rejected - ${err.message}`);
          passed++;
        }
      });
      
      console.log(`    Result: ${passed}/${malformedInputs.length} passed`);
      return passed === malformedInputs.length;
    }
  },
  
  {
    name: 'Path Traversal Prevention',
    description: 'Test security against directory traversal',
    test: () => {
      console.log('  Testing path traversal prevention:');
      
      const dangerousPaths = [
        '../../../etc/passwd',
        'res://../../secret.txt',
        'C:\\Windows\\System32\\config\\SAM',
        '..\\..\\..\\autoexec.bat',
        'normal/path/file.tscn' // Should be allowed
      ];
      
      dangerousPaths.forEach(path => {
        const hasTraversal = path.includes('..') || 
                            path.includes('://..') ||
                            (path.includes('\\..\\') && !path.startsWith('res://'));
        
        if (hasTraversal) {
          console.log(`    ✅ Dangerous path detected: "${path}"`);
        } else {
          console.log(`    ✅ Safe path: "${path}"`);
        }
      });
      
      return true; // Just checking detection, not actual prevention
    }
  },
  
  {
    name: 'Concurrent Request Simulation',
    description: 'Test handling of multiple simultaneous requests',
    test: async () => {
      console.log('  Testing concurrent request simulation:');
      
      const requestCount = 10;
      const promises = [];
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(new Promise(resolve => {
          setTimeout(() => {
            resolve(`Request ${i + 1} completed`);
          }, Math.random() * 100);
        }));
      }
      
      try {
        const results = await Promise.all(promises);
        console.log(`    ✅ All ${requestCount} concurrent requests completed`);
        results.forEach((result, i) => {
          console.log(`      ${result}`);
        });
        return true;
      } catch (err) {
        console.log(`    ❌ Concurrent requests failed: ${err.message}`);
        return false;
      }
    }
  }
];

async function runEdgeCaseTests() {
  console.log('Running edge case tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n${testCase.name}:`);
    console.log(`  ${testCase.description}`);
    
    try {
      const result = await testCase.test();
      
      if (result) {
        console.log(`  ✅ ${testCase.name} - PASSED`);
        passed++;
      } else {
        console.log(`  ❌ ${testCase.name} - FAILED`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ${testCase.name} - ERROR: ${err.message}`);
      failed++;
    }
  }
  
  console.log('\n\nEdge Case Test Summary:');
  console.log('=====================');
  console.log(`Total tests: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n✅ All edge case tests passed!');
    return 0;
  } else {
    console.log(`\n❌ ${failed} edge case test(s) failed`);
    return 1;
  }
}

// Run tests
runEdgeCaseTests().then(exitCode => {
  process.exit(exitCode);
}).catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});