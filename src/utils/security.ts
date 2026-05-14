export function isPathSafe(filePath: string): boolean {
  if (!filePath) return false;
  // Prevent flag injection
  if (filePath.startsWith('-')) return false;
  return true;
}

import path from 'path';

export function isValidExecutable(executable: string): boolean {
  if (!executable) return false;
  // Only allow Godot executables to prevent arbitrary command execution
  const basename = path.basename(executable);
  return basename.toLowerCase().startsWith('godot');
}

export function sanitizeUserArguments(args: string[]): string[] {
  if (!args || !Array.isArray(args)) return [];

  // Create a safe copy of arguments
  const safeArgs = [...args];

  // Prohibited flags for user input
  const prohibitedFlags = [
    '--script', '-s',
    '--export', '--export-debug', '--export-release', '--export-pack',
    '--headless',
    '--quit', '-q',
    '--build-solutions',
    '--dump-gdextension-interface',
    '--dump-extension-api',
  ];

  for (const arg of safeArgs) {
    const lowercaseArg = arg.toLowerCase();

    // Check exact matches
    if (prohibitedFlags.includes(lowercaseArg)) {
      throw new Error(`Security Error: Prohibited argument '${arg}'`);
    }

    // Check prefix matches for flags with assigned values (e.g., --script=...)
    for (const flag of prohibitedFlags) {
      if (lowercaseArg.startsWith(`${flag}=`)) {
        throw new Error(`Security Error: Prohibited argument '${arg}'`);
      }
    }
  }

  return safeArgs;
}
