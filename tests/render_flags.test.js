import { describe, it, expect } from 'vitest';

const AppleStylePlugin = require('../input.js');
const { AppleStyleView } = require('../input.js');

describe('Render Pipeline Flags', () => {
  it('should map explicit parity settings from plugin', () => {
    const plugin = new AppleStylePlugin();
    plugin.settings = {
      useNativePipeline: true,
      enableLegacyFallback: false,
      enforceNativeParity: false,
    };

    const view = new AppleStyleView({}, plugin);
    const flags = view.getRenderPipelineFlags();

    expect(flags.useNativePipeline).toBe(true);
    expect(flags.enableLegacyFallback).toBe(false);
    expect(flags.enforceNativeParity).toBe(false);
    expect(typeof flags.parityTransform).toBe('function');
  });

  it('should default parity flags when settings are missing', () => {
    const plugin = new AppleStylePlugin();
    plugin.settings = {};

    const view = new AppleStyleView({}, plugin);
    const flags = view.getRenderPipelineFlags();

    expect(flags.useNativePipeline).toBe(false);
    expect(flags.enableLegacyFallback).toBe(true);
    expect(flags.enforceNativeParity).toBe(true);
  });
});
