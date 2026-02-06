import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Obsidian manually with factory
vi.mock('obsidian', () => {
  return {
    Plugin: class {},
    ItemView: class {
      constructor() {
        this.containerEl = document.createElement('div');
        this.containerEl.createEl = (tag, opts) => {
          const el = document.createElement(tag);
          if (opts && opts.cls) el.className = opts.cls;
          if (opts && opts.text) el.textContent = opts.text;
          this.containerEl.appendChild(el);
          return el;
        };
      }
    },
    Notice: class {},
    MarkdownView: class {},
    PluginSettingTab: class {},
    Setting: class {
      constructor() { return this; }
      setName() { return this; }
      setDesc() { return this; }
      addToggle() { return this; }
      addText() { return this; }
      addButton() { return this; }
      setHeading() { return this; }
    },
    requestUrl: async () => ({ json: {}, status: 200, headers: {} }),
    setIcon: () => {},
  };
});

const { AppleStyleView } = require('../input.js');

// Mock fetch globally
global.fetch = vi.fn();

describe('AppleStyleView - Image Processing', () => {
  let view;

  beforeEach(() => {
    view = new AppleStyleView(null, null);
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    // Mock Image
    global.Image = class {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
        setTimeout(() => this.onload && this.onload(), 10);
      }
    };

    // Reset fetch mock
    global.fetch.mockReset();
  });

  it('should handle app:// images (Desktop)', async () => {
    // Setup DOM with image
    const div = document.createElement('div');
    div.innerHTML = '<img src="app://local/path/image.png" />';

    // Mock fetch response
    global.fetch.mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' }))
    });

    // Mock blobToJpegDataUrl (since canvas is hard to mock in jsdom perfectly without canvas package)
    // We'll spy on the method instead to verify it's called
    view.convertImageToLocally = vi.fn().mockResolvedValue(true);

    const hasProcessed = await view.processImagesToDataURL(div);

    // We expect it to find the image and try to process it
    expect(hasProcessed).toBe(true);
    expect(view.convertImageToLocally).toHaveBeenCalled();
  });

  it('should handle capacitor:// images (Mobile)', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<img src="capacitor://localhost/path/image.png" />';

    // Mock methods
    view.convertImageToLocally = vi.fn().mockResolvedValue(true);

    const hasProcessed = await view.processImagesToDataURL(div);

    expect(hasProcessed).toBe(true); // Should return true if checking capacitor://
    expect(view.convertImageToLocally).toHaveBeenCalled();
  });

  it('should ignore remote images in local processing', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<img src="https://example.com/image.png" />';

    view.convertImageToLocally = vi.fn();

    const hasProcessed = await view.processImagesToDataURL(div);

    expect(hasProcessed).toBe(false);
    expect(view.convertImageToLocally).not.toHaveBeenCalled();
  });
});
