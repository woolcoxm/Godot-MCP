import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const analyzeScriptSchema = z.object({
  scriptPath: z.string().describe('Path to the GDScript file to analyze'),
});

interface ScriptAnalysis {
  scriptPath: string;
  className?: string;
  extendsClass?: string;
  functions: Array<{
    name: string;
    returnType?: string;
    parameters: Array<{name: string, type?: string}>;
    isVirtual: boolean;
    isStatic: boolean;
    lines: number;
  }>;
  variables: Array<{
    name: string;
    type?: string;
    isExport: boolean;
    isConst: boolean;
    defaultValue?: any;
  }>;
  signals: Array<{
    name: string;
    parameters: Array<{name: string, type: string}>;
  }>;
  enums: Array<{
    name: string;
    values: Record<string, any>;
  }>;
  issues: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    line?: number;
    column?: number;
  }>;
  metrics: {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    complexity: number;
    functionCount: number;
    variableCount: number;
  };
}

export function createAnalyzeScriptTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_analyze_script',
    name: 'Analyze GDScript',
    description: 'Perform static analysis on a GDScript file to find issues and provide metrics',
    category: 'script',
    inputSchema: analyzeScriptSchema,
    handler: async (args) => {
      // Read the script file
      const readOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: args.scriptPath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read script: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Script file is empty or could not be read');
      }

      const scriptContent = readResult.data.content;
      const lines = scriptContent.split('\n');
      
      const analysis: ScriptAnalysis = {
        scriptPath: args.scriptPath,
        functions: [],
        variables: [],
        signals: [],
        enums: [],
        issues: [],
        metrics: {
          totalLines: lines.length,
          codeLines: 0,
          commentLines: 0,
          blankLines: 0,
          complexity: 0,
          functionCount: 0,
          variableCount: 0,
        },
      };

      let currentFunction: any = null;
      let inFunction = false;
      let functionStartLine = 0;
      let braceCount = 0;

      // Parse the script line by line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const originalLine = lines[i];
        
        // Count line types
        if (line === '') {
          analysis.metrics.blankLines++;
        } else if (line.startsWith('#')) {
          analysis.metrics.commentLines++;
        } else {
          analysis.metrics.codeLines++;
        }

        // Skip comments for parsing
        if (line.startsWith('#')) {
          continue;
        }

        // Extract class name
        if (line.startsWith('class_name')) {
          const match = line.match(/class_name\s+(\w+)/);
          if (match) {
            analysis.className = match[1];
          }
        }

        // Extract extends
        if (line.startsWith('extends')) {
          const match = line.match(/extends\s+(\w+(?:\.\w+)*)/);
          if (match) {
            analysis.extendsClass = match[1];
          }
        }

        // Extract signals
        if (line.startsWith('signal')) {
          const signalMatch = line.match(/signal\s+(\w+)(?:\((.*)\))?/);
          if (signalMatch) {
            const signalName = signalMatch[1];
            const paramsStr = signalMatch[2];
            const parameters: Array<{name: string, type: string}> = [];
            
            if (paramsStr) {
              const paramMatches = paramsStr.matchAll(/(\w+)\s*:\s*(\w+(?:\.\w+)*)/g);
              for (const match of paramMatches) {
                parameters.push({ name: match[1], type: match[2] });
              }
            }
            
            analysis.signals.push({
              name: signalName,
              parameters,
            });
          }
        }

        // Extract enums
        if (line.startsWith('enum')) {
          const enumMatch = line.match(/enum\s+(\w+)\s*{(.*)}/);
          if (enumMatch) {
            const enumName = enumMatch[1];
            const valuesStr = enumMatch[2];
            const values: Record<string, any> = {};
            
            if (valuesStr) {
              const valuePairs = valuesStr.split(',').map((v: any) => v.trim());
              for (const pair of valuePairs) {
                if (pair.includes('=')) {
                  const [key, value] = pair.split('=').map((s: any) => s.trim());
                  values[key] = value;
                } else if (pair) {
                  values[pair] = Object.keys(values).length;
                }
              }
            }
            
            analysis.enums.push({
              name: enumName,
              values,
            });
          }
        }

        // Extract variables
        if (!inFunction) {
          // Check for variable declarations
          const varMatch = line.match(/^(?:var|const)\s+(\w+)(?:\s*:\s*(\w+(?:\.\w+)*))?(?:\s*=\s*(.*))?$/);
          if (varMatch) {
            const isConst = line.startsWith('const');
            const isExport = originalLine.includes('@export');
            
            analysis.variables.push({
              name: varMatch[1],
              type: varMatch[2],
              isExport,
              isConst,
              defaultValue: varMatch[3],
            });
            analysis.metrics.variableCount++;
            
            // Check for unused variable naming convention
            if (varMatch[1].startsWith('_') && !isExport) {
              analysis.issues.push({
                type: 'info',
                message: `Private variable "${varMatch[1]}" detected (starts with underscore)`,
                line: i + 1,
              });
            }
            
            // Check for missing type annotation
            if (!varMatch[2] && !isConst) {
              analysis.issues.push({
                type: 'warning',
                message: `Variable "${varMatch[1]}" has no type annotation`,
                line: i + 1,
              });
            }
          }
        }

        // Detect function start
        if (line.includes('func ') && !line.includes('#')) {
          const funcMatch = line.match(/func\s+(\w+)(?:\((.*)\))?(?:\s*->\s*(\w+(?:\.\w+)*))?/);
          if (funcMatch) {
            inFunction = true;
            functionStartLine = i;
            braceCount = 0;
            
            const funcName = funcMatch[1];
            const paramsStr = funcMatch[2] || '';
            const returnType = funcMatch[3];
            
            const parameters: Array<{name: string, type?: string}> = [];
            if (paramsStr) {
              const paramList = paramsStr.split(',').map((p: any) => p.trim());
              for (const param of paramList) {
                if (param) {
                  if (param.includes(':')) {
                    const [name, type] = param.split(':').map((s: any) => s.trim());
                    parameters.push({ name, type });
                  } else {
                    parameters.push({ name: param });
                  }
                }
              }
            }
            
            const isVirtual = line.includes('virtual') || funcName.startsWith('_');
            const isStatic = line.includes('static');
            
            currentFunction = {
              name: funcName,
              returnType,
              parameters,
              isVirtual,
              isStatic,
              lines: 1,
            };
            
            analysis.metrics.functionCount++;
            
            // Check for missing return type on non-void functions
            if (!returnType && funcName !== '_ready' && funcName !== '_process' && 
                funcName !== '_physics_process' && funcName !== '_input') {
              analysis.issues.push({
                type: 'warning',
                message: `Function "${funcName}" has no return type annotation`,
                line: i + 1,
              });
            }
            
            // Check for missing parameter types
            for (const param of parameters) {
              if (!param.type) {
                analysis.issues.push({
                  type: 'warning',
                  message: `Parameter "${param.name}" in function "${funcName}" has no type annotation`,
                  line: i + 1,
                });
              }
            }
          }
        }

        // Track function body
        if (inFunction) {
          if (line.includes('{')) {
            braceCount += (line.match(/{/g) || []).length;
          }
          if (line.includes('}')) {
            braceCount -= (line.match(/}/g) || []).length;
          }
          
          if (currentFunction) {
            currentFunction.lines++;
          }

          // Check for common issues within functions
          if (line.includes('print(') || line.includes('print_debug(')) {
            analysis.issues.push({
              type: 'warning',
              message: 'Debug print statement found - consider removing for production',
              line: i + 1,
            });
          }

          if (line.includes('assert(')) {
            analysis.issues.push({
              type: 'info',
              message: 'Assert statement found - good practice for debugging',
              line: i + 1,
            });
          }

          // Check for magic numbers
          const magicNumberMatch = line.match(/\b\d+\b(?!\.\d)/);
          if (magicNumberMatch && !line.includes('#')) {
            analysis.issues.push({
              type: 'info',
              message: 'Magic number detected - consider using a named constant',
              line: i + 1,
            });
          }

          // Function ended
          if (braceCount === 0 && i > functionStartLine) {
            inFunction = false;
            if (currentFunction) {
              analysis.functions.push(currentFunction);
              
              // Calculate complexity (simple heuristic: if statements + loops)
              const functionLines = lines.slice(functionStartLine, i + 1).join('\n');
              const ifCount = (functionLines.match(/\bif\b/g) || []).length;
              const forCount = (functionLines.match(/\bfor\b/g) || []).length;
              const whileCount = (functionLines.match(/\bwhile\b/g) || []).length;
              analysis.metrics.complexity += ifCount + forCount + whileCount + 1;
              
              currentFunction = null;
            }
          }
        }
      }

      // Check for missing _ready function (common in Godot scripts)
      if (!analysis.functions.some(f => f.name === '_ready') && 
          analysis.extendsClass && analysis.extendsClass !== 'Node') {
        analysis.issues.push({
          type: 'info',
          message: 'No _ready() function found - consider adding initialization logic',
        });
      }

      // Check for unused variables (simple check)
      new Set<string>();
      scriptContent.toLowerCase();
      
      for (const variable of analysis.variables) {
        variable.name.toLowerCase();
        // Count occurrences (excluding declaration)
        const declarationPattern = new RegExp(`(?:var|const)\\s+${variable.name}\\b`, 'g');
        const declarationMatches = scriptContent.match(declarationPattern) || [];
        const usagePattern = new RegExp(`\\b${variable.name}\\b`, 'g');
        const usageMatches = scriptContent.match(usagePattern) || [];
        
        if (usageMatches.length <= declarationMatches.length) {
          analysis.issues.push({
            type: 'warning',
            message: `Variable "${variable.name}" appears to be unused`,
          });
        }
      }

      // Check for long functions
      for (const func of analysis.functions) {
        if (func.lines > 50) {
          analysis.issues.push({
            type: 'warning',
            message: `Function "${func.name}" is ${func.lines} lines long - consider refactoring`,
          });
        }
      }

      // Check for too many parameters
      for (const func of analysis.functions) {
        if (func.parameters.length > 5) {
          analysis.issues.push({
            type: 'warning',
            message: `Function "${func.name}" has ${func.parameters.length} parameters - consider using a data class`,
          });
        }
      }

      // ⚡ Bolt Optimization: Use a single reduce pass (O(n)) to count all issue types instead of multiple filter().length calls (O(3n)).
      const issueCounts = analysis.issues.reduce((counts, issue) => {
        counts[issue.type] = (counts[issue.type] || 0) + 1;
        return counts;
      }, { warning: 0, error: 0, info: 0 } as Record<string, number>);

      return {
        scriptPath: args.scriptPath,
        analysis,
        summary: {
          totalIssues: analysis.issues.length,
          warnings: issueCounts.warning,
          errors: issueCounts.error,
          info: issueCounts.info,
          metrics: analysis.metrics,
        },
        message: `Analyzed ${args.scriptPath}: ${analysis.issues.length} issues found`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}