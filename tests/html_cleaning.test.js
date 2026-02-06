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

describe('AppleStyleView - HTML Cleaning', () => {
  let view;

  beforeEach(() => {
    view = new AppleStyleView(null, null);
  });

  it('should remove margins from nested lists', () => {
    const inputHtml = `
      <ul>
        <li>
          Parent
          <ul style="margin-left: 20px;">
            <li>Child</li>
          </ul>
        </li>
      </ul>
    `;
    const outputHtml = view.cleanHtmlForDraft(inputHtml);
    expect(outputHtml).not.toContain('margin-left: 20px');
    expect(outputHtml).toContain('margin: 0');
  });

  it('should remove empty list items', () => {
    const inputHtml = `
      <ul>
        <li>Valid</li>
        <li>   </li>
        <li></li>
      </ul>
    `;
    const outputHtml = view.cleanHtmlForDraft(inputHtml);

    // Use jsdom to parse output
    const div = document.createElement('div');
    div.innerHTML = outputHtml;
    const lis = div.querySelectorAll('li');

    expect(lis.length).toBe(1);
    expect(lis[0].textContent).toBe('Valid');
  });

  it('should unwrap paragraphs inside list items (when nested list exists)', () => {
    const inputHtml = `
      <ul>
        <li>
          <p>Content</p>
          <ul><li>Nested</li></ul>
        </li>
      </ul>
    `;
    const outputHtml = view.cleanHtmlForDraft(inputHtml);
    expect(outputHtml).not.toContain('<p>');
    expect(outputHtml).toContain('Content');
  });
});
