const fs = require('fs');

let workflowTest = fs.readFileSync('tests/full-game-workflow.test.ts', 'utf8');
workflowTest = workflowTest.replace(/godot_export_project/g, 'godot_build_project');
fs.writeFileSync('tests/full-game-workflow.test.ts', workflowTest);

let integrationTest = fs.readFileSync('tests/integration-demo.test.ts', 'utf8');
integrationTest = integrationTest.replace(/godot_export_project/g, 'godot_build_project');
fs.writeFileSync('tests/integration-demo.test.ts', integrationTest);

let phase5Test = fs.readFileSync('tests/phase5-integration.test.ts', 'utf8');
phase5Test = phase5Test.replace(/godot_export_project/g, 'godot_build_project');
fs.writeFileSync('tests/phase5-integration.test.ts', phase5Test);
