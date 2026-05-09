export function isPathSafe(filePath: string): boolean {
  if (filePath.trim().startsWith('-')) {
    return false;
  }
  return true;
}

export function isValidExecutable(executablePath: string): boolean {
  const parts = executablePath.replace(/\\/g, '/').split('/');
  const filename = parts[parts.length - 1];
  return filename.toLowerCase().startsWith('godot');
}

export function sanitizeUserArguments(args: string[]): string[] {
  const prohibitedFlags = ['--script', '-s', '--export', '--headless'];

  for (const arg of args) {
    const lowerArg = arg.toLowerCase();
    for (const flag of prohibitedFlags) {
      if (lowerArg === flag || lowerArg.startsWith(`${flag}=`)) {
        throw new Error(`Prohibited flag encountered: ${arg}`);
      }
    }
  }

  return args;
}

export function sanitizeArguments(args: string[]): string[] {
  const prohibitedFlags = ['--script', '-s'];

  for (const arg of args) {
    const lowerArg = arg.toLowerCase();
    for (const flag of prohibitedFlags) {
      if (lowerArg === flag || lowerArg.startsWith(`${flag}=`)) {
        throw new Error(`Prohibited flag encountered: ${arg}`);
      }
    }
  }

  return args;
}
