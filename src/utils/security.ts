/**
 * Verifies that a user-provided executable name is safe.
 * Must only be applied to untrusted user input.
 */
export function isValidExecutable(executable: string): boolean {
  if (!executable) return false;
  const basename = executable.split(/[/\\]/).pop() || '';
  return basename.toLowerCase().startsWith('godot');
}

/**
 * Validates that user-provided paths do not start with a hyphen to prevent flag injection.
 */
export function isPathSafe(path: string): boolean {
  if (!path) return false;
  return !path.startsWith('-');
}

/**
 * Restrictive utility that blocks export and headless flags for untrusted user input.
 */
export function sanitizeUserArguments(args: string[]): string[] {
  if (!args) return [];
  const prohibitedFlags = ['--script', '-s', '--export', '--headless'];

  for (const arg of args) {
    for (const flag of prohibitedFlags) {
      if (arg === flag || arg.startsWith(`${flag}=`)) {
        throw new Error(`Prohibited flag encountered: ${flag}`);
      }
    }
  }
  return args;
}

/**
 * General-purpose filter that preserves expected Godot flags like '--export' for internal command construction.
 */
export function sanitizeArguments(args: string[]): string[] {
  if (!args) return [];
  // Could implement basic cleaning here if needed, but per instructions, it preserves flags.
  return args;
}
