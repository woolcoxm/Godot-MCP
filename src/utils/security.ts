export function isPathSafe(filePath: string): boolean {
  if (!filePath) return false;
  // Primary goal: preventing flag injection (e.g., paths starting with '-')
  const basename = filePath.split(/[\/\\]/).pop() || filePath;
  return !basename.startsWith('-');
}

export function isValidExecutable(exePath: string): boolean {
  if (!exePath) return false;
  const basename = exePath.split(/[\/\\]/).pop() || exePath;
  return basename.toLowerCase().startsWith('godot');
}

export function sanitizeUserArguments(args: string[]): string[] {
  const prohibitedFlags = ['--script', '-s', '--export', '--headless'];
  for (const arg of args) {
    for (const flag of prohibitedFlags) {
      if (arg === flag || arg.startsWith(`${flag}=`)) {
        throw new Error(`Prohibited flag encountered: ${arg}`);
      }
    }
  }
  return args;
}
