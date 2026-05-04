export function isValidExecutable(executable: string): boolean {
  // Use a strict allowlist approach to prevent RCE through Godot editor launch tools
  const allowed = ['godot', 'godot.exe', 'godot-headless', 'godot-server'];
  const basename = executable.split(/[/\\]/).pop()?.toLowerCase() || '';

  if (allowed.includes(basename)) return true;

  // Allow official Godot versioned binary names (e.g. Godot_v4.2.1-stable_win64.exe)
  return /^godot_v[\w.-]+$/.test(basename) || /^godot_v[\w.-]+\.exe$/.test(basename);
}

export function sanitizeArguments(args: string[]): string[] {
  const sanitized: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--script' || arg === '-s') {
      i++; // Skip the flag and its value
      continue;
    }
    if (arg.startsWith('--script=') || arg.startsWith('-s=')) {
      continue; // Skip the combined flag and value
    }
    sanitized.push(arg);
  }
  return sanitized;
}

export function sanitizeUserArguments(args: string[]): string[] {
  return sanitizeArguments(args).filter(arg =>
    !arg.startsWith('--export') && !arg.startsWith('--headless')
  );
}

export function isPathSafe(filePath: string): boolean {
  // Prevent directory traversal attacks by disallowing parent directory references
  if (filePath.includes('\0')) return false;
  if (filePath.includes('..')) return false;
  return true;
}
