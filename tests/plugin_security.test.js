import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('WechatAPI Security', () => {
  let WechatAPI;
  let obsidianMock;

  beforeEach(() => {
    // 1. Reset modules to ensure clean state
    vi.resetModules();

    // 2. Get the obsidian mock (which is likely aliased or we are modifying the cached version if it exists)
    // In this environment, we just need to ensure we modify the object that input.js will receive.
    obsidianMock = require('obsidian');

    // 3. Reset and mock requestUrl
    // We attach the mock to the exported object
    obsidianMock.requestUrl = vi.fn();

    // 4. Require the module under test AFTER mocking dependencies
    const inputModule = require('../input.js');
    WechatAPI = inputModule.WechatAPI;
  });

  it('should throw Security Error when proxy URL is not HTTPS in sendRequest', async () => {
    const api = new WechatAPI('appId', 'secret', 'http://insecure-proxy.com');
    await expect(api.sendRequest('https://api.weixin.qq.com/test')).rejects.toThrow(
      'Security Error: Insecure HTTP proxy blocked. Proxy URL must use HTTPS.'
    );
  });

  it('should throw Security Error when proxy URL is not HTTPS in uploadMultipart', async () => {
    const api = new WechatAPI('appId', 'secret', 'http://insecure-proxy.com');
    const blob = new Blob(['test'], { type: 'image/jpeg' });

    await expect(api.uploadMultipart('https://api.weixin.qq.com/upload', blob, 'media')).rejects.toThrow(
      'Security Error: Insecure HTTP proxy blocked. Proxy URL must use HTTPS.'
    );
  });

  it('should allow HTTPS proxy in sendRequest', async () => {
    obsidianMock.requestUrl.mockResolvedValue({ json: { success: true } });

    const api = new WechatAPI('appId', 'secret', 'https://secure-proxy.com');
    await api.sendRequest('https://api.weixin.qq.com/test');

    expect(obsidianMock.requestUrl).toHaveBeenCalledTimes(1);
    expect(obsidianMock.requestUrl).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://secure-proxy.com'
    }));
  });

  it('should allow HTTPS proxy in uploadMultipart', async () => {
    obsidianMock.requestUrl.mockResolvedValue({ json: { media_id: '123' } });

    const api = new WechatAPI('appId', 'secret', 'https://secure-proxy.com');
    const blob = new Blob(['test'], { type: 'image/jpeg' });

    await api.uploadMultipart('https://api.weixin.qq.com/upload', blob, 'media');

    expect(obsidianMock.requestUrl).toHaveBeenCalledTimes(1);
    expect(obsidianMock.requestUrl).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://secure-proxy.com'
    }));
  });

  it('should allow uppercase HTTPS proxy URL', async () => {
    obsidianMock.requestUrl.mockResolvedValue({ json: { success: true } });

    const api = new WechatAPI('appId', 'secret', 'HTTPS://secure-proxy.com');
    await api.sendRequest('https://api.weixin.qq.com/test');

    expect(obsidianMock.requestUrl).toHaveBeenCalledTimes(1);
    expect(obsidianMock.requestUrl).toHaveBeenCalledWith(expect.objectContaining({
      url: 'HTTPS://secure-proxy.com'
    }));
  });
});
