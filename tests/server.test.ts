import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GodotMCPServer } from '../src/server.js';

describe('GodotMCPServer', () => {
  let server: GodotMCPServer;

  beforeEach(() => {
    server = new GodotMCPServer();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should create server instance', () => {
    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(GodotMCPServer);
  });

  it('should have start and stop methods', () => {
    expect(typeof server.start).toBe('function');
    expect(typeof server.stop).toBe('function');
  });
});

describe('Config', () => {
  it('should load default config', async () => {
    const { config } = await import('../src/config.js');
    expect(config).toBeDefined();
    expect(config.godotPath).toBe('godot');
    expect(config.editorPort).toBe(13337);
    expect(config.runtimePort).toBe(13338);
  });
});

describe('Logger', () => {
  it('should create logger instance', async () => {
    const { logger } = await import('../src/utils/logger.js');
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});