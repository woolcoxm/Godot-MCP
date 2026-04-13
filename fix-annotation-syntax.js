const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fixed = false;
  
  // Look for the pattern where annotations are outside the object
  for (let i = 0; i < lines.length - 3; i++) {
    if (lines[i].includes('handler: async') && 
        lines[i + 1].includes('return handle') &&
        lines[i + 2].trim() === '}' &&
        lines[i + 3].trim().startsWith('readOnlyHint:')) {
      
      // Move annotations inside the object
      lines[i + 2] = '    },';
      lines[i + 3] = lines[i + 3].replace(/^\s+/, '    ');
      lines[i + 4] = lines[i + 4].replace(/^\s+/, '    ');
      lines[i + 5] = lines[i + 5].replace(/^\s+/, '    ');
      
      // Remove trailing comma from last annotation if present
      if (lines[i + 5].trim().endsWith(',')) {
        lines[i + 5] = lines[i + 5].trim().slice(0, -1);
      }
      
      fixed = true;
      console.log(`Fixed ${path.basename(filePath)}`);
      break;
    }
  }
  
  if (fixed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
  
  return fixed;
}

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

function main() {
  const toolsDir = path.join(__dirname, 'src', 'tools');
  const toolFiles = findToolFiles(toolsDir);
  
  console.log('Fixing annotation syntax...\n');
  
  let fixedCount = 0;
  
  for (const file of toolFiles) {
    try {
      if (fixFile(file)) {
        fixedCount++;
      }
    } catch (error) {
      console.log(`Error fixing ${file}: ${error.message}`);
    }
  }
  
  console.log(`\nFixed ${fixedCount} files`);
}

main();