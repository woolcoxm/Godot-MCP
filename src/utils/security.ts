export function isPathSafe(path: string): boolean {
  return !path.startsWith('-');
}

export function isValidExecutable(executablePath: string): boolean {
  const filename = executablePath.replace(/\\/g, '/').split('/').pop() || '';
  return filename.toLowerCase().startsWith('godot');
}

export function sanitizeUserArguments(args: string[]): string[] {
  const prohibitedFlags = ['--script', '-s', '--export', '--headless'];
  for (const arg of args) {
    for (const flag of prohibitedFlags) {
      if (arg === flag || arg.startsWith(`${flag}=`)) {
        throw new Error(`Prohibited flag: ${arg}`);
      }
    }
  }
  return args;
}

export function sanitizeArguments(args: string[]): string[] {
  return args; // Preserves expected internal Godot flags
}
