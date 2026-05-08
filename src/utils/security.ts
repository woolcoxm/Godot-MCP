export function isValidExecutable(exe: string): boolean {
  return (exe.split(/[/\\]/).pop() || '').toLowerCase().startsWith('godot');
}
export function isPathSafe(p: string): boolean {
  return !p.trim().startsWith('-');
}
export function sanitizeUserArguments(args: string[]): string[] {
  for (const arg of args) {
    const lower = arg.toLowerCase();
    if (['--script', '-s', '--export', '--headless'].includes(lower) ||
        ['--script=', '--export=', '--headless='].some(prefix => lower.startsWith(prefix))) {
      throw new Error(`Prohibited flag detected: ${arg}`);
    }
  }
  return args;
}
export function sanitizeArguments(args: string[]): string[] {
  return args;
}
