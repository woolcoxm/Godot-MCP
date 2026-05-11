export function isValidExecutable(executable: string): boolean {
  const baseName = executable.split(/[\/\\]/).pop() || '';
  return baseName.toLowerCase().startsWith('godot');
}

export function isPathSafe(pathStr: string): boolean {
  return !pathStr.startsWith('-');
}

export function sanitizeUserArguments(args: string[]): string[] {
  const prohibitedFlags = ['--script', '-s', '--export', '--headless'];

  for (const arg of args) {
    for (const flag of prohibitedFlags) {
      if (arg === flag || arg.startsWith(`${flag}=`)) {
        throw new Error(`Prohibited flag detected: ${flag}`);
      }
    }
  }

  return args;
}
