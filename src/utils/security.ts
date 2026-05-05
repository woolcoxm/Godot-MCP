import * as path from 'path';

/**
 * Checks if the given path is safe (prevents directory traversal).
 */
export function isPathSafe(inputPath: string, basePath?: string): boolean {
  if (inputPath.includes('\0')) return false;

  const normalizedPath = path.normalize(inputPath);

  if (basePath) {
    const absoluteBase = path.resolve(basePath);
    const absoluteInput = path.resolve(basePath, inputPath);
    return absoluteInput.startsWith(absoluteBase);
  }

  return !normalizedPath.includes('..');
}

/**
 * Validates if the executable name is allowed.
 * Checks that the executable name starts with 'godot' to support versioned names.
 */
export function isValidExecutable(executable: string): boolean {
  const baseName = path.basename(executable).toLowerCase();
  return baseName.startsWith('godot');
}

/**
 * General-purpose filter that strips dangerous Godot flags AND their subsequent values.
 * Preserves expected internal flags like --export.
 */
export function sanitizeArguments(args: string[]): string[] {
  const dangerousFlags = new Set(['--script', '-s']);
  const sanitized: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (dangerousFlags.has(arg)) {
      // Skip the flag and its subsequent value
      i++;
      continue;
    }
    if (arg.startsWith('--script=')) {
      continue;
    }
    sanitized.push(arg);
  }

  return sanitized;
}

/**
 * Restrictive filter for untrusted user input.
 * Blocks export and headless flags in addition to dangerous script flags.
 */
export function sanitizeUserArguments(args: string[]): string[] {
  const baseSanitized = sanitizeArguments(args);
  const userDangerousFlags = new Set(['--export', '--export-debug', '--export-pack', '--headless']);
  const result: string[] = [];

  for (let i = 0; i < baseSanitized.length; i++) {
    const arg = baseSanitized[i];
    if (userDangerousFlags.has(arg)) {
      continue;
    }
    if (arg.startsWith('--export=')) {
      continue;
    }
    result.push(arg);
  }

  return result;
}
