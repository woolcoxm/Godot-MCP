// import { logger } from './logger.js';
import {
  ScriptInfo,
  SignalDefinition,
  VariableDefinition,
  FunctionDefinition,
  ConstantDefinition,
  EnumDefinition,
  ArgumentDefinition,
} from '../types/godot.js';

export class ScriptGenerator {
  static generateScript(scriptInfo: ScriptInfo): string {
    const lines: string[] = [];
    
    // Add extends line
    lines.push(`extends ${scriptInfo.extends_class}`);
    lines.push('');
    
    // Add class_name if present
    if (scriptInfo.class_name) {
      lines.push(`class_name ${scriptInfo.class_name}`);
      lines.push('');
    }
    
    // Add signals
    if (scriptInfo.signals && scriptInfo.signals.length > 0) {
      for (const signalDef of scriptInfo.signals) {
        lines.push(this.generateSignal(signalDef));
      }
      lines.push('');
    }
    
    // Add enums
    if (scriptInfo.enums && scriptInfo.enums.length > 0) {
      for (const enumDef of scriptInfo.enums) {
        lines.push(this.generateEnum(enumDef));
      }
      lines.push('');
    }
    
    // Add constants
    if (scriptInfo.constants && scriptInfo.constants.length > 0) {
      for (const constant of scriptInfo.constants) {
        lines.push(this.generateConstant(constant));
      }
      lines.push('');
    }
    
    // Add variables
    if (scriptInfo.variables && scriptInfo.variables.length > 0) {
      for (const variable of scriptInfo.variables) {
        lines.push(this.generateVariable(variable));
      }
      lines.push('');
    }
    
    // Add functions
    if (scriptInfo.functions && scriptInfo.functions.length > 0) {
      for (const func of scriptInfo.functions) {
        lines.push(this.generateFunction(func));
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }

  private static generateSignal(signalDef: SignalDefinition): string {
    let line = `signal ${signalDef.name}`;
    
    if (signalDef.arguments && signalDef.arguments.length > 0) {
      const args = signalDef.arguments.map(arg => `${arg.name}: ${arg.type}`).join(', ');
      line += `(${args})`;
    }
    
    return line;
  }

  private static generateEnum(enumDef: EnumDefinition): string {
    const lines: string[] = [];
    lines.push(`enum ${enumDef.name} {`);
    
    for (const [key, value] of Object.entries(enumDef.values)) {
      lines.push(`\t${key} = ${value},`);
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  private static generateConstant(constant: ConstantDefinition): string {
    return `const ${constant.name} = ${this.serializeValue(constant.value)}`;
  }

  private static generateVariable(variable: VariableDefinition): string {
    const parts: string[] = [];
    
    if (variable.static) parts.push('static');
    if (variable.onready) parts.push('onready');
    if (variable.export) parts.push('export');
    
    parts.push(`var ${variable.name}`);
    
    if (variable.type) {
      parts.push(`: ${variable.type}`);
    }
    
    if (variable.default_value !== undefined) {
      parts.push(` = ${this.serializeValue(variable.default_value)}`);
    }
    
    return parts.join(' ');
  }

  private static generateFunction(func: FunctionDefinition): string {
    const lines: string[] = [];
    
    // Function signature
    const signatureParts: string[] = [];
    
    if (func.static) signatureParts.push('static');
    if (func.virtual) signatureParts.push('virtual');
    
    signatureParts.push(`func ${func.name}(`);
    
    // Add arguments
    const args = func.arguments.map(arg => {
      let argStr = arg.name;
      if (arg.type) argStr += `: ${arg.type}`;
      if (arg.hint) {
        argStr += `: ${arg.hint}`;
        if (arg.hint_string) argStr += `("${arg.hint_string}")`;
      }
      return argStr;
    }).join(', ');
    
    signatureParts.push(args);
    signatureParts.push(')');
    
    if (func.return_type && func.return_type !== 'void') {
      signatureParts.push(` -> ${func.return_type}`);
    }
    
    lines.push(signatureParts.join(''));
    
    // Add function body
    if (func.body && func.body.trim()) {
      const bodyLines = func.body.split('\n');
      for (const bodyLine of bodyLines) {
        lines.push(`\t${bodyLine}`);
      }
    } else {
      lines.push('\tpass');
    }
    
    return lines.join('\n');
  }

  private static serializeValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (value === null) {
      return 'null';
    }
    
    if (Array.isArray(value)) {
      const items = value.map(item => this.serializeValue(item));
      return `[${items.join(', ')}]`;
    }
    
    if (value && typeof value === 'object') {
      // Handle Godot vector types
      if ('x' in value && 'y' in value && !('z' in value)) {
        return `Vector2(${value.x}, ${value.y})`;
      }
      if ('x' in value && 'y' in value && 'z' in value) {
        return `Vector3(${value.x}, ${value.y}, ${value.z})`;
      }
      if ('r' in value && 'g' in value && 'b' in value) {
        const a = 'a' in value ? value.a : 1;
        return `Color(${value.r}, ${value.g}, ${value.b}, ${a})`;
      }
      
      // Default to dictionary
      const items = Object.entries(value).map(([key, val]) => 
        `"${key}": ${this.serializeValue(val)}`
      );
      return `{${items.join(', ')}}`;
    }
    
    return String(value);
  }

  static parseScript(content: string): ScriptInfo {
    const lines = content.split('\n');
    const scriptInfo: Partial<ScriptInfo> = {
      path: '',
      extends_class: 'Node',
      signals: [],
      variables: [],
      functions: [],
      constants: [],
      enums: [],
    };

    let currentFunction: Partial<FunctionDefinition> | null = null;
    let currentFunctionBody: string[] = [];
    let inFunction = false;
    let indentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const originalLine = lines[i];
      
      if (!line || line.startsWith('#')) {
        continue; // Skip empty lines and comments
      }

      // Check if we're in a function body
      if (inFunction) {
        const currentIndent = this.getIndentLevel(originalLine);
        
        if (currentIndent > indentLevel) {
          // Still in function body
          currentFunctionBody.push(originalLine.substring(indentLevel));
          continue;
        } else {
          // Function body ended
          inFunction = false;
          if (currentFunction) {
            currentFunction.body = currentFunctionBody.join('\n');
            scriptInfo.functions!.push(currentFunction as FunctionDefinition);
            currentFunction = null;
            currentFunctionBody = [];
          }
        }
      }

      // Parse different statement types
      if (line.startsWith('extends ')) {
        scriptInfo.extends_class = line.substring('extends '.length).trim();
      } else if (line.startsWith('class_name ')) {
        scriptInfo.class_name = line.substring('class_name '.length).trim();
      } else if (line.startsWith('signal ')) {
        const signal = this.parseSignal(line);
        if (signal) scriptInfo.signals!.push(signal);
      } else if (line.startsWith('enum ')) {
        const enumDef = this.parseEnum(lines, i);
        if (enumDef) {
          scriptInfo.enums!.push(enumDef);
          // Skip lines that are part of the enum
          i = this.skipEnumBody(lines, i);
        }
      } else if (line.startsWith('const ')) {
        const constant = this.parseConstant(line);
        if (constant) scriptInfo.constants!.push(constant);
      } else if (line.startsWith('var ') || line.includes(' var ')) {
        const variable = this.parseVariable(line);
        if (variable) scriptInfo.variables!.push(variable);
      } else if (line.startsWith('func ') || line.startsWith('static func ') || line.startsWith('virtual func ')) {
        const func = this.parseFunctionSignature(line);
        if (func) {
          currentFunction = func;
          inFunction = true;
          indentLevel = this.getIndentLevel(originalLine);
          currentFunctionBody = [];
        }
      }
    }

    // Handle last function if file ends in function body
    if (inFunction && currentFunction) {
      currentFunction.body = currentFunctionBody.join('\n');
      scriptInfo.functions!.push(currentFunction as FunctionDefinition);
    }

    return scriptInfo as ScriptInfo;
  }

  private static parseSignal(line: string): SignalDefinition | null {
    const signalMatch = line.match(/signal\s+(\w+)(?:\(([^)]*)\))?/);
    if (!signalMatch) return null;

    const signalDef: SignalDefinition = {
      name: signalMatch[1],
      arguments: [],
    };

    if (signalMatch[2]) {
      const args = signalMatch[2].split(',').map(arg => arg.trim());
      for (const arg of args) {
        if (arg) {
          const [name, type] = arg.split(':').map(part => part.trim());
          signalDef.arguments.push({ name, type: type || '' });
        }
      }
    }

    return signalDef;
  }

  private static parseEnum(lines: string[], startIndex: number): EnumDefinition | null {
    const enumMatch = lines[startIndex].match(/enum\s+(\w+)\s*{/);
    if (!enumMatch) return null;

    const enumDef: EnumDefinition = {
      name: enumMatch[1],
      values: {},
    };

    let i = startIndex + 1;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line === '}') {
        break;
      }
      
      if (line && !line.startsWith('#')) {
        const enumMatch = line.match(/(\w+)\s*=\s*([^,]+)/);
        if (enumMatch) {
          const key = enumMatch[1];
          const value = this.parseValue(enumMatch[2].trim().replace(',', ''));
          enumDef.values[key] = value;
        }
      }
      
      i++;
    }

    return enumDef;
  }

  private static skipEnumBody(lines: string[], startIndex: number): number {
    let i = startIndex;
    let braceCount = 0;
    
    for (; i < lines.length; i++) {
      const line = lines[i];
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount === 0 && i > startIndex) {
        break;
      }
    }
    
    return i;
  }

  private static parseConstant(line: string): ConstantDefinition | null {
    const constMatch = line.match(/const\s+(\w+)\s*=\s*(.+)/);
    if (!constMatch) return null;

    return {
      name: constMatch[1],
      value: this.parseValue(constMatch[2].trim()),
    };
  }

  private static parseVariable(line: string): VariableDefinition | null {
    // Remove export/onready/static modifiers
    let modifiers = '';
    let varLine = line;
    
    if (varLine.includes('export')) {
      modifiers += 'export ';
      varLine = varLine.replace('export', '');
    }
    if (varLine.includes('onready')) {
      modifiers += 'onready ';
      varLine = varLine.replace('onready', '');
    }
    if (varLine.includes('static')) {
      modifiers += 'static ';
      varLine = varLine.replace('static', '');
    }
    
    const varMatch = varLine.match(/var\s+(\w+)(?::\s*([^=]+))?(?:\s*=\s*(.+))?/);
    if (!varMatch) return null;

    const variable: VariableDefinition = {
      name: varMatch[1],
      type: varMatch[2]?.trim() || '',
      default_value: varMatch[3] ? this.parseValue(varMatch[3].trim()) : undefined,
      export: modifiers.includes('export'),
      onready: modifiers.includes('onready'),
      static: modifiers.includes('static'),
    };

    return variable;
  }

  private static parseFunctionSignature(line: string): Partial<FunctionDefinition> | null {
    const funcMatch = line.match(/(?:(static|virtual)\s+)?func\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\w+))?/);
    if (!funcMatch) return null;

    const func: Partial<FunctionDefinition> = {
      name: funcMatch[2],
      return_type: funcMatch[4] || 'void',
      arguments: [],
      body: '',
      static: funcMatch[1] === 'static',
      virtual: funcMatch[1] === 'virtual',
    };

    if (funcMatch[3]) {
      const args = funcMatch[3].split(',').map(arg => arg.trim());
      for (const arg of args) {
        if (arg) {
          const argMatch = arg.match(/(\w+)(?::\s*([^:]+)(?::\s*([^:]+)(?:\(([^)]+)\))?)?)?/);
          if (argMatch) {
            const argument: ArgumentDefinition = {
              name: argMatch[1],
              type: argMatch[2] || '',
            };
            
            if (argMatch[3]) {
              argument.hint = argMatch[3];
              if (argMatch[4]) {
                argument.hint_string = argMatch[4];
              }
            }
            
            func.arguments!.push(argument);
          }
        }
      }
    }

    return func;
  }

  private static getIndentLevel(line: string): number {
    let indent = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '\t') {
        indent++;
      } else if (line[i] === ' ') {
        // Count spaces as tabs (assuming 4 spaces per indent)
        if (line.substring(i, i + 4) === '    ') {
          indent++;
          i += 3;
        }
      } else {
        break;
      }
    }
    return indent;
  }

  private static parseValue(valueStr: string): any {
    // Handle strings
    if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
      return valueStr.substring(1, valueStr.length - 1).replace(/\\"/g, '"');
    }
    
    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
      return parseFloat(valueStr);
    }
    
    // Handle booleans
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;
    
    // Handle null
    if (valueStr === 'null') return null;
    
    // Handle arrays (simplified)
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      // Simple array parsing - would need more robust parser for nested arrays
      const content = valueStr.substring(1, valueStr.length - 1).trim();
      if (!content) return [];
      
      // Very basic splitting - doesn't handle nested structures properly
      const items = content.split(',').map(item => this.parseValue(item.trim()));
      return items;
    }
    
    // Handle dictionaries (simplified)
    if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
      // Simple dict parsing
      return {}; // Would need proper parser
    }
    
    // Default to string
    return valueStr;
  }
}