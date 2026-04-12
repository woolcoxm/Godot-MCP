import { z } from 'zod';

const ConfigSchema = z.object({
  godotPath: z.string().default('godot'),
  editorPort: z.number().default(13337),
  runtimePort: z.number().default(13338),
  headlessTimeout: z.number().default(30000),
  editorTimeout: z.number().default(10000),
  runtimeTimeout: z.number().default(5000),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  maxHeadlessProcesses: z.number().min(1).max(5).default(1),
  cacheEnabled: z.boolean().default(true),
  cacheTtl: z.number().default(60000),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const envConfig = {
    godotPath: process.env.GODOT_PATH,
    editorPort: process.env.GODOT_EDITOR_PORT ? parseInt(process.env.GODOT_EDITOR_PORT) : undefined,
    runtimePort: process.env.GODOT_RUNTIME_PORT ? parseInt(process.env.GODOT_RUNTIME_PORT) : undefined,
    headlessTimeout: process.env.GODOT_HEADLESS_TIMEOUT ? parseInt(process.env.GODOT_HEADLESS_TIMEOUT) : undefined,
    editorTimeout: process.env.GODOT_EDITOR_TIMEOUT ? parseInt(process.env.GODOT_EDITOR_TIMEOUT) : undefined,
    runtimeTimeout: process.env.GODOT_RUNTIME_TIMEOUT ? parseInt(process.env.GODOT_RUNTIME_TIMEOUT) : undefined,
    logLevel: process.env.GODOT_LOG_LEVEL as any,
    maxHeadlessProcesses: process.env.GODOT_MAX_HEADLESS_PROCESSES ? parseInt(process.env.GODOT_MAX_HEADLESS_PROCESSES) : undefined,
    cacheEnabled: process.env.GODOT_CACHE_ENABLED ? process.env.GODOT_CACHE_ENABLED === 'true' : undefined,
    cacheTtl: process.env.GODOT_CACHE_TTL ? parseInt(process.env.GODOT_CACHE_TTL) : undefined,
  };

  const filteredConfig = Object.fromEntries(
    Object.entries(envConfig).filter(([_, value]) => value !== undefined)
  );

  return ConfigSchema.parse(filteredConfig);
}

export const config = loadConfig();