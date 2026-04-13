const fs = require('fs');
const path = require('path');

function findToolFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findToolFiles(fullPath));
    } else if (item.name.endsWith('.ts') && !item.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function auditToolFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check if it's a tool file (has export function create*Tool)
  const isToolFile = content.includes('export function create') && content.includes('Tool');
  if (!isToolFile) return null;
  
  // Extract tool ID from return statement
  const toolIdMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
  if (!toolIdMatch) return null;
  
  const toolId = toolIdMatch[1];
  
  // Check for annotations
  const hasReadOnlyHint = content.includes('readOnlyHint:');
  const hasDestructiveHint = content.includes('destructiveHint:');
  const hasIdempotentHint = content.includes('idempotentHint:');
  
  return {
    file: path.relative(__dirname, filePath),
    toolId,
    hasReadOnlyHint,
    hasDestructiveHint,
    hasIdempotentHint,
    missingAnnotations: [
      !hasReadOnlyHint && 'readOnlyHint',
      !hasDestructiveHint && 'destructiveHint',
      !hasIdempotentHint && 'idempotentHint'
    ].filter(Boolean)
  };
}

function main() {
  const __dirname = process.cwd();
  const toolsDir = path.join(__dirname, 'src', 'tools');
  const toolFiles = findToolFiles(toolsDir);
  
  console.log('Auditing tool annotations...\n');
  console.log(`Found ${toolFiles.length} tool files\n`);
  
  const results = [];
  let totalMissing = 0;
  
  for (const file of toolFiles) {
    const result = auditToolFile(file);
    if (result) {
      results.push(result);
      if (result.missingAnnotations.length > 0) {
        totalMissing += result.missingAnnotations.length;
      }
    }
  }
  
  // Sort by missing annotations
  results.sort((a, b) => b.missingAnnotations.length - a.missingAnnotations.length);
  
  // Print results
  console.log('TOOL ANNOTATION AUDIT RESULTS:\n');
  console.log('='.repeat(80));
  
  for (const result of results) {
    const status = result.missingAnnotations.length === 0 ? '✅ COMPLETE' : `❌ MISSING ${result.missingAnnotations.length}`;
    console.log(`${status} ${result.toolId}`);
    console.log(`  File: ${result.file}`);
    if (result.missingAnnotations.length > 0) {
      console.log(`  Missing: ${result.missingAnnotations.join(', ')}`);
    }
    console.log();
  }
  
  console.log('='.repeat(80));
  console.log(`\nSUMMARY:`);
  console.log(`Total tools: ${results.length}`);
  console.log(`Tools with complete annotations: ${results.filter(r => r.missingAnnotations.length === 0).length}`);
  console.log(`Tools missing annotations: ${results.filter(r => r.missingAnnotations.length > 0).length}`);
  console.log(`Total missing annotations: ${totalMissing}`);
  
  // Write recommendations
  console.log('\nRECOMMENDATIONS:');
  console.log('1. Tools that read data without modifying should have readOnlyHint: true');
  console.log('2. Tools that modify or delete data should have destructiveHint: true');
  console.log('3. Tools that can be safely repeated should have idempotentHint: true');
  console.log('4. Discovery tools (list_categories, list_tools, search_tools) should have readOnlyHint: true and idempotentHint: true');
}

main();