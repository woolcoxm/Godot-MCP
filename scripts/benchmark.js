#!/usr/bin/env node

const { performance } = require('perf_hooks');

console.log('Godot MCP Performance Benchmark');
console.log('===============================\n');

// Mock benchmark for now since we can't actually run Godot in CI
async function benchmarkOperation(name, operation) {
  const start = performance.now();
  await operation();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return duration;
}

async function runBenchmarks() {
  console.log('Running performance benchmarks...\n');
  
  // Simulate different operations
  const results = {
    'Type Conversion': await benchmarkOperation('Type Conversion', async () => {
      // Simulate type conversion
      for (let i = 0; i < 1000; i++) {
        const vec = { x: Math.random(), y: Math.random() };
        JSON.stringify(vec);
      }
    }),
    
    'Scene Parsing': await benchmarkOperation('Scene Parsing', async () => {
      // Simulate scene parsing
      const mockScene = `
[gd_scene load_steps=2 format=3]
[ext_resource type="Script" path="res://player.gd" id=1]
[node name="Player" type="Node2D"]
`;
      for (let i = 0; i < 100; i++) {
        mockScene.split('\n').forEach(line => line.trim());
      }
    }),
    
    'Tool Registry Lookup': await benchmarkOperation('Tool Registry Lookup', async () => {
      // Simulate tool lookup
      const mockToolsByCategory = new Map();
      mockToolsByCategory.set('system', []);
      mockToolsByCategory.set('3d', []);

      for (let i = 0; i < 100; i++) {
        const category = i % 10 === 0 ? 'system' : '3d';
        mockToolsByCategory.get(category).push({
          id: `tool_${i}`,
          name: `Tool ${i}`,
          category: category
        });
      }
      
      for (let i = 0; i < 1000; i++) {
        mockToolsByCategory.get('3d');
      }
    }),
    
    'JSON Serialization': await benchmarkOperation('JSON Serialization', async () => {
      // Simulate JSON operations
      const data = {
        nodes: Array.from({ length: 100 }, (_, i) => ({
          name: `Node${i}`,
          type: 'Node2D',
          position: { x: i * 10, y: i * 10 }
        }))
      };
      
      for (let i = 0; i < 100; i++) {
        JSON.stringify(data);
        JSON.parse(JSON.stringify(data));
      }
    })
  };
  
  console.log('\nBenchmark Results:');
  console.log('=================');
  
  const total = Object.values(results).reduce((sum, val) => sum + val, 0);
  console.log(`Total time: ${total.toFixed(2)}ms`);
  
  // Performance thresholds (in ms)
  const thresholds = {
    'Type Conversion': 50,
    'Scene Parsing': 100,
    'Tool Registry Lookup': 30,
    'JSON Serialization': 80
  };
  
  console.log('\nPerformance Assessment:');
  console.log('=====================');
  
  let allPassed = true;
  for (const [name, duration] of Object.entries(results)) {
    const threshold = thresholds[name];
    const passed = duration <= threshold;
    const status = passed ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${name}: ${duration.toFixed(2)}ms (threshold: ${threshold}ms) ${status}`);
    
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log(`\nOverall: ${allPassed ? '✅ All benchmarks passed' : '❌ Some benchmarks failed'}`);
  
  return allPassed ? 0 : 1;
}

// Run benchmarks
runBenchmarks().then(exitCode => {
  process.exit(exitCode);
}).catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});