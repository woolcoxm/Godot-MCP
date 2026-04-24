import path from 'path';

export function isValidExecutable(executable: string): boolean {
  const blocked = ['sh', 'bash', 'zsh', 'cmd', 'powershell', 'pwsh', 'python', 'node', 'ruby', 'perl', 'php', 'curl', 'wget', 'netcat', 'nc', 'gcc'];
  const name = path.basename(executable).toLowerCase();
  return !blocked.some(b => name === b || name.startsWith(`${b}.`));
}

export function sanitizeArguments(args: string[]): string[] {
  const safeArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const lower = arg.toLowerCase();

    // Check if current arg is a dangerous flag
    if (lower === '--script' || lower === '-s' || lower === '--execute') {
      // Skip the flag
      // And if the next arg doesn't start with '-', skip it too (it's the script/command)
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        i++; // Skip the parameter
      }
      continue;
    }

    // Check if it's flag=value format
    if (lower.startsWith('--script=') || lower.startsWith('--execute=')) {
      continue;
    }

    safeArgs.push(arg);
  }

  return safeArgs;
}
