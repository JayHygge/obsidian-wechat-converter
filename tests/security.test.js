import { describe, it, expect, beforeEach, vi } from 'vitest';
const fs = require('fs');
const path = require('path');

// Mock markdown-it and global environment
if (typeof window === 'undefined') {
    global.window = global;
}

global.markdownit = function(options) {
  return {
    render: (md) => md,
    renderer: {
      rules: {}
    }
  };
};

// Load converter via eval
const converterPath = path.resolve(__dirname, '../converter.js');
eval(fs.readFileSync(converterPath, 'utf-8'));

describe('Security Sanitization', () => {
  let converter;

  beforeEach(() => {
    const mockTheme = {
      getThemeColorValue: () => '#000',
      getSizes: () => ({ base: 14 }),
      getFontFamily: () => 'sans-serif',
      getStyle: () => '',
      themeName: 'github'
    };
    converter = new window.AppleStyleConverter(mockTheme);
    // Initialize md manually for testing since we mocked markdownit
    converter.md = global.markdownit();
    converter.setupRenderRules();
  });

  it('should neutralize javascript: links via validateLink', () => {
    expect(converter.validateLink('javascript:alert(1)')).toBe('#');
    expect(converter.validateLink('data:text/html,<html>')).toBe('data:text/html,<html>'); // Allowed in our whitelist but handled by OS/Browser
    expect(converter.validateLink('https://google.com')).toBe('https://google.com');
    expect(converter.validateLink('obsidian://open?vault=test')).toBe('obsidian://open?vault=test');
  });

  it('should strip dangerous tags and content', () => {
    const malicious = '<script>alert("xss")</script><div>Safe</div><iframe src="malicious.com"></iframe>';
    const sanitized = converter.sanitizeHtml(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('<iframe');
    expect(sanitized).toContain('<div>Safe</div>');
  });

  it('should remove onerror and other event handlers', () => {
    const malicious = '<img src=x onerror=alert(1) onclick="malicious()">';
    const sanitized = converter.sanitizeHtml(malicious);
    expect(sanitized).toContain('<img src=x');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('onclick');
  });

  it('should neutralize links in the actual render rules', () => {
    const tokens = [{
      attrGet: () => 'javascript:alert(1)',
      type: 'link_open'
    }];
    const html = converter.md.renderer.rules.link_open(tokens, 0);
    expect(html).toContain('href="#"');
    expect(html).not.toContain('javascript:');
  });
});
