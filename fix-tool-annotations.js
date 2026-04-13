const fs = require('fs');
const path = require('path');

// Rules for determining annotations based on tool ID or description
const annotationRules = [
  // Discovery tools - read-only and idempotent
  {
    pattern: /list_categories|list_tools|search_tools/,
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true
  },
  
  // Read-only tools
  {
    pattern: /read_|get_|scene_tree|docs_resource|script_resource|scene_resource|project_resource/,
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true
  },
  
  // Creation tools - destructive, not idempotent
  {
    pattern: /create_/,
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  },
  
  // Modification tools - destructive, not idempotent
  {
    pattern: /modify_|set_|apply_|save_|delete_|remove_/,
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  },
  
  // Default for tools that don't match above
  {
    pattern: /.*/,
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  }
];

function getAnnotationsForTool(toolId) {
  for (const rule of annotationRules) {
    if (rule.pattern.test(toolId)) {
      return {
        readOnlyHint: rule.readOnlyHint,
        destructiveHint: rule.destructiveHint,
        idempotentHint: rule.idempotentHint
      };
    }
  }
  return {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false
  };
}

function fixToolFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Find the tool ID
  let toolId = null;
  for (const line of lines) {
    const match = line.match(/id:\s*['"]([^'"]+)['"]/);
    if (match) {
      toolId = match[1];
      break;
    }
  }
  
  if (!toolId) {
    console.log(`❌ No tool ID found in ${filePath}`);
    return false;
  }
  
  // Get annotations for this tool
  const annotations = getAnnotationsForTool(toolId);
  
  // Check if annotations already exist
  const hasReadOnlyHint = content.includes('readOnlyHint:');
  const hasDestructiveHint = content.includes('destructiveHint:');
  const hasIdempotentHint = content.includes('idempotentHint:');
  
  if (hasReadOnlyHint && hasDestructiveHint && hasIdempotentHint) {
    console.log(`✅ ${toolId} already has all annotations`);
    return false;
  }
  
  // Find the return statement for the tool
  let inReturnStatement = false;
  let returnStartLine = -1;
  let returnEndLine = -1;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('return {')) {
      inReturnStatement = true;
      returnStartLine = i;
      braceCount = 1;
    } else if (inReturnStatement) {
      // Count braces
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      if (braceCount === 0) {
        returnEndLine = i;
        break;
      }
    }
  }
  
  if (returnStartLine === -1 || returnEndLine === -1) {
    console.log(`❌ Could not find return statement in ${filePath}`);
    return false;
  }
  
  // Build new lines
  const newLines = [...lines];
  
  // Find where to insert annotations (before the closing brace of the return statement)
  const insertLine = returnEndLine;
  
  // Build annotation lines
  const annotationLines = [];
  if (!hasReadOnlyHint) {
    annotationLines.push(`    readOnlyHint: ${annotations.readOnlyHint},`);
  }
  if (!hasDestructiveHint) {
    annotationLines.push(`    destructiveHint: ${annotations.destructiveHint},`);
  }
  if (!hasIdempotentHint) {
    annotationLines.push(`    idempotentHint: ${annotations.idempotentHint},`);
  }
  
  if (annotationLines.length > 0) {
    // Insert annotations before the closing brace
    const lineBeforeBrace = newLines[insertLine - 1];
    const indent = lineBeforeBrace.match(/^(\s*)/)[1];
    
    // Add annotations with proper indentation
    for (let i = annotationLines.length - 1; i >= 0; i--) {
      newLines.splice(insertLine, 0, indent + annotationLines[i]);
    }
    
    // Write the file
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    
    console.log(`✅ Fixed ${toolId}: added ${annotationLines.length} annotation(s)`);
    return true;
  }
  
  return false;
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
  
  console.log('Fixing tool annotations...\n');
  console.log(`Found ${toolFiles.length} tool files\n`);
  
  let fixedCount = 0;
  
  for (const file of toolFiles) {
    try {
      if (fixToolFile(file)) {
        fixedCount++;
      }
    } catch (error) {
      console.log(`❌ Error fixing ${file}: ${error.message}`);
    }
  }
  
  console.log(`\nFixed ${fixedCount} tool files`);
}

main();