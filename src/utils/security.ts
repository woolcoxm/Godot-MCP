import path from 'path';

/**
 * Validates if an executable name is safe to run.
 * Uses an allowlist approach for known safe Godot executables.
 */
export function isValidExecutable(executable: string): boolean {
  if (!executable) return true;

  const baseName = path.basename(executable).toLowerCase();

  // Strict allowlist of permitted executables
  const allowedExecutables = [
    'godot',
    'godot.exe',
    'godot-headless',
    'godot-server'
  ];

  // Also allow versioned Godot executables like godot4, godot-4.2
  if (baseName.startsWith('godot')) {
    return true;
  }

  return allowedExecutables.includes(baseName);
}

/**
 * Sanitizes arguments to prevent argument injection.
 * Removes dangerous flags AND their associated values.
 */
export function sanitizeArguments(args: string[]): string[] {
  if (!args || !Array.isArray(args)) return [];

  const dangerousFlags = [
    '--script', '-s',
    '--execute', '-e',
    '--build-solutions',
    '--quit', '-q'
  ];

  const sanitized: string[] = [];
  let skipNext = false;

  for (let i = 0; i < args.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const arg = args[i];
    if (dangerousFlags.includes(arg)) {
      // Skip the flag and its value (if it exists and doesn't look like another flag)
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        skipNext = true;
      }
      continue;
    }

    sanitized.push(arg);
  }

  return sanitized;
}
