import { describe, it, expect, beforeEach, vi } from 'vitest';

// 1. Define the mock factory
const mockFactory = () => {
  return {
    Plugin: class {},
    ItemView: class {
        constructor() {
            this.containerEl = {
                createEl: () => ({ appendChild: () => {} }),
                appendChild: () => {}
            };
        }
    },
    Notice: class {},
    MarkdownView: class {},
    PluginSettingTab: class {},
    Setting: class {},
    requestUrl: vi.fn(),
    setIcon: () => {},
  };
};

// 2. Mock the module globally using the factory
vi.mock('obsidian', mockFactory);

// 3. Import the mocked module to access the spy
import { requestUrl } from 'obsidian';

const { WechatAPI, AppleStyleView } = require('../input.js');

describe('WechatAPI - Upload & MIME Logic', () => {
  let api;

  beforeEach(() => {
    // Reset the mock before each test
    requestUrl.mockReset();
    api = new WechatAPI('appid', 'secret', 'https://proxy.com');
  });

  // === Task A: Proxy Upload Optimization (FileReader) ===
  it('should use FileReader for proxy uploads (Perf Optimization)', async () => {
    // 1. Mock Blob
    const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });

    // 2. Mock the proxy response
    requestUrl.mockResolvedValue({
      json: { media_id: '123', url: 'http://img.com' }
    });

    // 3. Execute
    await api.uploadMultipart('http://wx-api.com', mockBlob, 'media');

    // 4. Verify
    expect(requestUrl).toHaveBeenCalledTimes(1);
    const callArg = requestUrl.mock.calls[0][0];
    const body = JSON.parse(callArg.body);

    expect(body.method).toBe('UPLOAD');
    expect(body.fileData).toBeDefined();
    // Verify base64 conversion "fake-image-data" -> "ZmFrZS1pbWFnZS1kYXRh"
    expect(body.fileData).toBe('ZmFrZS1pbWFnZS1kYXRh');
  });

  // === Task B: Remote MIME Parsing ===
  it('should detect MIME type from headers for http images', async () => {
    const view = new AppleStyleView(null, null);

    requestUrl.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: { 'content-type': 'image/gif' }
    });

    const blob = await view.srcToBlob('http://example.com/anim.gif');
    expect(blob.type).toBe('image/gif');
  });

  it('should fallback to image/jpeg if header is missing', async () => {
    const view = new AppleStyleView(null, null);

    requestUrl.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: {} // No content-type
    });

    const blob = await view.srcToBlob('http://example.com/unknown.jpg');
    expect(blob.type).toBe('image/jpeg');
  });

  it('should handle Content-Type case insensitively', async () => {
    const view = new AppleStyleView(null, null);

    requestUrl.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: { 'Content-Type': 'image/png' }
    });

    const blob = await view.srcToBlob('http://example.com/icon.png');
    expect(blob.type).toBe('image/png');
  });
});
