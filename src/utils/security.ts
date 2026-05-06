export function isPathSafe(inputPath: string): boolean {
  if (!inputPath) return false;
  if (inputPath.trim().startsWith('-')) return false;
  return true;
}

export function sanitizeUserArguments(args: string[]): string[] {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--script' || arg === '-s' || arg.startsWith('--script=') || arg.startsWith('-s=')) {
      throw new Error('Script execution via arguments is not allowed for security reasons.');
    }

    if (arg === '--export' || arg === '--export-release' || arg === '--export-debug' || arg === '--export-pack' ||
        arg.startsWith('--export=') || arg.startsWith('--export-release=') || arg.startsWith('--export-debug=') || arg.startsWith('--export-pack=')) {
      throw new Error('Export operations via generic arguments are not allowed. Use the explicit export preset tools instead.');
    }
  }
  return args;
}
