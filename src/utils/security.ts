import * as path from 'path';

/**
 * Validates that an executable name starts with 'godot' to prevent RCE.
 * Intended for untrusted user input only.
 */
export function isValidExecutable(executablePath: string): boolean {
  if (!executablePath) return false;
  const basename = path.basename(executablePath).toLowerCase();
  return basename.startsWith('godot');
}

/**
 * Validates that a path is safe and does not contain flag injections.
 * Allows '..' for legitimate relative paths.
 */
export function isPathSafe(inputPath: string): boolean {
  if (!inputPath) return true;
  // Prevent flag injection (paths starting with -)
  if (inputPath.trim().startsWith('-')) {
    return false;
  }
  return true;
}

/**
 * Strictly sanitizes untrusted user arguments, throwing on prohibited flags.
 */
export function sanitizeUserArguments(args: string[]): string[] {
  if (!args || !Array.isArray(args)) return [];

  const prohibitedFlags = ['--script', '-s', '--export', '--headless'];

  for (const arg of args) {
    const lowerArg = arg.toLowerCase();
    for (const flag of prohibitedFlags) {
      if (lowerArg === flag || lowerArg.startsWith(`${flag}=`)) {
        throw new Error(`Security violation: Prohibited flag '${flag}' is not allowed in user arguments.`);
      }
    }
  }

  return args;
}

/**
 * General purpose filter that preserves expected Godot flags.
 */
export function sanitizeArguments(args: string[]): string[] {
  if (!args || !Array.isArray(args)) return [];

  // This is a more permissive version for internal use
  const prohibitedFlags = ['--script', '-s'];

  for (const arg of args) {
    const lowerArg = arg.toLowerCase();
    for (const flag of prohibitedFlags) {
      if (lowerArg === flag || lowerArg.startsWith(`${flag}=`)) {
        throw new Error(`Security violation: Prohibited flag '${flag}' is not allowed.`);
      }
    }
  }

  return args;
}
