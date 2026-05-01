import * as path from 'path';

/**
 * Validates if the given executable is a safe Godot editor executable.
 * Uses a strict allowlist to prevent arbitrary code execution (RCE).
 */
export function isValidExecutable(executablePath: string): boolean {
  if (!executablePath) return false;

  // Extract just the filename without path
  const filename = path.basename(executablePath).toLowerCase();

  const allowedExecutables = [
    'godot',
    'godot.exe',
    'godot-headless',
    'godot-server',
    'godot_v4',
    'godot4'
  ];

  // Check if it exactly matches our allowlist, or starts with a known godot prefix
  // e.g. "Godot_v4.2.1-stable_win64.exe"
  const isAllowed = allowedExecutables.includes(filename) ||
                    filename.startsWith('godot_') ||
                    filename.startsWith('godot4');

  return isAllowed;
}

/**
 * Sanitizes command line arguments to prevent argument injection attacks.
 * Specifically strips dangerous flags that could lead to RCE.
 */
export function sanitizeArguments(args: string[]): string[] {
  if (!args || !Array.isArray(args)) return [];

  const safeArgs: string[] = [];
  let skipNext = false;

  for (let i = 0; i < args.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const arg = args[i];

    // Check for dangerous arguments that allow running arbitrary scripts
    if (arg === '--script' || arg === '-s') {
      // Skip the flag and its associated script path
      skipNext = true;
      continue;
    }

    // Prevent overriding project path securely
    if (arg === '--path') {
      skipNext = true;
      continue;
    }

    // Reject any command execution flags
    if (arg === '--cmd' || arg === '-c') {
      skipNext = true;
      continue;
    }

    safeArgs.push(arg);
  }

  return safeArgs;
}

/**
 * Validates if a path is safe from directory traversal attacks.
 */
export function isPathSafe(projectPath: string): boolean {
  if (!projectPath) return false;

  // Normalize the path first
  const normalized = path.normalize(projectPath);

  // Check for obvious directory traversal attempts
  if (normalized.includes('..')) {
    return false;
  }

  return true;
}
