const fs = require('fs');

let workflowTest = fs.readFileSync('tests/full-game-workflow.test.ts', 'utf8');
workflowTest = workflowTest.replace(/Exported project/g, 'Build completed');
fs.writeFileSync('tests/full-game-workflow.test.ts', workflowTest);
