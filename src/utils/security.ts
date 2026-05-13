export function isPathSafe(filePath: string): boolean {
  if (filePath.trim().startsWith('-')) {
    return false;
  }
  return true;
}

export function isValidExecutable(executable: string): boolean {
  const name = executable.split(/[/\\]/).pop() || '';
  return name.toLowerCase().startsWith('godot');
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
