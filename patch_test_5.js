const fs = require('fs');

let workflowTest = fs.readFileSync('tests/full-game-workflow.test.ts', 'utf8');
workflowTest = workflowTest.replace(/godot_export_project/g, 'godot_build_project');
fs.writeFileSync('tests/full-game-workflow.test.ts', workflowTest);

let integrationTest = fs.readFileSync('tests/integration-demo.test.ts', 'utf8');
integrationTest = integrationTest.replace(/godot_export_project/g, 'godot_build_project');
fs.writeFileSync('tests/integration-demo.test.ts', integrationTest);

let phase5Test = fs.readFileSync('tests/phase5-integration.test.ts', 'utf8');
phase5Test = phase5Test.replace(
  `describe('Phase 5: Advanced Systems Integration', () => {`,
  `import { registerAllTools } from '../src/tools/register-tools';\n\ndescribe('Phase 5: Advanced Systems Integration', () => {`
);
phase5Test = phase5Test.replace(
  `    // Note: In a real test, we would import the actual registerAllTools function\n    // For this integration test, we'll test the tool definitions directly`,
  `    registerAllTools(registry, transport as any);`
);
fs.writeFileSync('tests/phase5-integration.test.ts', phase5Test);
