// __mocks__/obsidian.js
module.exports = {
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
