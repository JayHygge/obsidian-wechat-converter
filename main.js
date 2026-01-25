const { Plugin, MarkdownView, ItemView, Notice } = require('obsidian');
const { PluginSettingTab, Setting } = require('obsidian');

// 视图类型标识
const APPLE_STYLE_VIEW = 'apple-style-converter';

// 默认设置
const DEFAULT_SETTINGS = {
  fontSize: 'medium',
  avatarUrl: 'https://raw.githubusercontent.com/Ceeon/pic/main/f28cc8dc-b865-4e89-9d42-a76460159591.jpeg',
  enableWatermark: true,
};

/**
 * 🍎 Apple Style 转换视图
 */
class AppleStyleView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentHtml = null;
    this.converter = null;
    this.lastActiveFile = null; // 缓存最后一个活动的 Markdown 文件
  }

  getViewType() {
    return APPLE_STYLE_VIEW;
  }

  getDisplayText() {
    return '🍎 Apple 风格转换';
  }

  getIcon() {
    return 'wand';
  }

  async onOpen() {
    console.log('🍎 转换器面板打开');
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('apple-converter-container');

    // 加载依赖
    await this.loadDependencies();

    // 创建工具栏
    this.createToolbar(container);

    // 创建预览区
    this.previewContainer = container.createEl('div', {
      cls: 'apple-converter-preview',
    });

    this.setPlaceholder();

    // 监听文件切换
    console.log('📡 注册文件切换监听器');
    this.registerActiveFileChange();

    // 自动转换当前文档（如果有的话）
    setTimeout(async () => {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView && this.converter) {
        console.log('📄 初始转换:', activeView.file?.basename);
        await this.convertCurrent(true); // 静默模式
      }
    }, 500);
  }

  /**
   * 监听活动文件切换
   */
  registerActiveFileChange() {
    // 使用 registerEvent 确保事件正确管理
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', async (leaf) => {
        console.log('🔄 文件切换事件触发');

        // 如果有打开的 Markdown 文件，缓存它
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && activeView.file) {
          this.lastActiveFile = activeView.file;
          console.log('📄 缓存文件:', this.lastActiveFile.basename);
        }

        // 更新当前文档显示
        this.updateCurrentDoc();

        // 如果有打开的 Markdown 文件，自动转换（静默模式）
        if (activeView && this.converter) {
          // 延迟一下，确保文件已完全加载
          setTimeout(async () => {
            try {
              console.log('📄 自动转换:', activeView.file?.basename);
              await this.convertCurrent(true); // 静默模式
            } catch (error) {
              console.log('自动转换跳过:', error.message);
            }
          }, 300);
        } else {
          console.log('⚠️ 没有活动的 Markdown 视图或转换器未初始化');
        }
      })
    );
  }

  /**
   * 加载依赖库
   */
  async loadDependencies() {
    const adapter = this.app.vault.adapter;
    const basePath = '.obsidian/plugins/obsidian-apple-style';

    try {
      // 加载 markdown-it（只加载一次）
      if (typeof markdownit === 'undefined') {
        const mdContent = await adapter.read(`${basePath}/lib/markdown-it.min.js`);
        (0, eval)(mdContent);
      }

      // 加载主题（强制重新加载以应用最新修改）
      console.log('🎨 重新加载主题文件...');
      const themeContent = await adapter.read(`${basePath}/themes/apple-theme.js`);
      (0, eval)(themeContent);
      console.log('✅ 主题加载完成');

      // 加载转换器（强制重新加载）
      console.log('🔧 重新加载转换器...');
      const converterContent = await adapter.read(`${basePath}/converter.js`);
      (0, eval)(converterContent);
      console.log('✅ 转换器加载完成');

      // 初始化转换器
      const avatarUrl = this.plugin.settings.enableWatermark ? this.plugin.settings.avatarUrl : '';
      this.converter = new AppleStyleConverter(AppleTheme, this.plugin.settings.fontSize, avatarUrl);
      await this.converter.initMarkdownIt();

      console.log('✅ 依赖加载完成');
    } catch (error) {
      console.error('❌ 依赖加载失败:', error);
      new Notice('依赖加载失败: ' + error.message);
    }
  }

  /**
   * 创建工具栏
   */
  createToolbar(container) {
    const toolbar = container.createEl('div', {
      cls: 'apple-converter-toolbar',
    });

    // 标题区域
    const titleArea = toolbar.createEl('div', {
      cls: 'apple-converter-title-area',
    });

    titleArea.createEl('div', {
      cls: 'apple-converter-title',
      text: '🍎 Apple 风格转换器',
    });

    // 当前文档名称
    this.currentDocLabel = titleArea.createEl('div', {
      cls: 'apple-current-doc',
      text: '未选择文档',
    });

    // 更新文档名称
    this.updateCurrentDoc();

    // 按钮组
    const btnGroup = toolbar.createEl('div', {
      cls: 'apple-converter-btns',
    });

    // 字体大小选择器
    const sizeSelector = btnGroup.createEl('select', {
      cls: 'apple-size-select',
    });

    const sizes = [
      { value: 'small', text: '小号 (14px)' },
      { value: 'medium', text: '中号 (16px)' },
      { value: 'large', text: '大号 (18px)' }
    ];

    sizes.forEach(size => {
      const option = sizeSelector.createEl('option', {
        value: size.value,
        text: size.text,
      });

      if (this.plugin.settings.fontSize === size.value) {
        option.selected = true;
      }
    });

    sizeSelector.addEventListener('change', async (e) => {
      this.plugin.settings.fontSize = e.target.value;
      await this.plugin.saveSettings();

      // 重新初始化转换器
      if (this.converter) {
        this.converter.fontSize = e.target.value;
        // 同时更新头像 URL
        const avatarUrl = this.plugin.settings.enableWatermark ? this.plugin.settings.avatarUrl : '';
        this.converter.avatarUrl = avatarUrl;
      }

      // 如果有内容，重新转换
      if (this.currentHtml) {
        await this.convertCurrent();
      }
    });

    // 转换按钮
    const convertBtn = btnGroup.createEl('button', {
      cls: 'apple-btn apple-btn-convert',
      text: '⚡ 转换当前文档',
    });

    convertBtn.addEventListener('click', async () => {
      await this.convertCurrent();
    });

    // 复制按钮
    const copyBtn = btnGroup.createEl('button', {
      cls: 'apple-btn apple-btn-copy',
      text: '📋 复制 HTML',
    });

    copyBtn.addEventListener('click', async () => {
      await this.copyHTML();
    });
  }

  /**
   * 更新当前文档显示
   */
  updateCurrentDoc() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView && this.currentDocLabel) {
      const file = activeView.file;
      console.log('📝 更新文档显示:', file.basename);
      this.currentDocLabel.setText(`📄 ${file.basename}`);
      this.currentDocLabel.style.color = '#0071e3';
    } else if (this.lastActiveFile && this.currentDocLabel) {
      // 使用缓存的文件名
      console.log('📝 显示缓存文档:', this.lastActiveFile.basename);
      this.currentDocLabel.setText(`📄 ${this.lastActiveFile.basename}`);
      this.currentDocLabel.style.color = '#0071e3';
    } else if (this.currentDocLabel) {
      console.log('⚠️ 未选择文档');
      this.currentDocLabel.setText('未选择文档');
      this.currentDocLabel.style.color = '#86868b';
    }
  }

  /**
   * 设置占位符
   */
  setPlaceholder() {
    this.previewContainer.empty();

    const placeholder = this.previewContainer.createEl('div', {
      cls: 'apple-placeholder',
    });

    placeholder.createEl('div', {
      cls: 'apple-placeholder-icon',
      text: '🍎',
    });

    placeholder.createEl('h2', {
      text: 'Apple 风格 Markdown 转换器',
    });

    placeholder.createEl('p', {
      text: '将 Markdown 转换为优雅的 HTML，可直接粘贴到公众号等平台',
    });

    const steps = placeholder.createEl('div', {
      cls: 'apple-steps',
    });

    steps.createEl('div', { text: '1️⃣ 打开 Markdown 文件' });
    steps.createEl('div', { text: '2️⃣ 点击 "转换当前文档" 按钮' });
    steps.createEl('div', { text: '3️⃣ 点击 "复制 HTML" 粘贴到其他平台' });
  }

  /**
   * 转换当前文档
   * @param {boolean} silent - 静默模式，不显示通知
   */
  async convertCurrent(silent = false) {
    let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    let markdown = '';

    // 如果当前没有活动的 Markdown 视图，尝试使用缓存的文件
    if (!activeView && this.lastActiveFile) {
      // 从缓存的文件读取内容
      try {
        markdown = await this.app.vault.read(this.lastActiveFile);
        console.log('📄 使用缓存文件:', this.lastActiveFile.basename);
      } catch (error) {
        console.error('读取缓存文件失败:', error);
        if (!silent) {
          new Notice('请先打开一个 Markdown 文件');
        }
        return;
      }
    } else if (activeView) {
      markdown = activeView.editor.getValue();
    } else {
      if (!silent) {
        new Notice('请先打开一个 Markdown 文件');
      }
      return;
    }

    if (!markdown.trim()) {
      if (!silent) {
        new Notice('当前文件内容为空');
      }
      return;
    }

    try {
      if (!silent) {
        new Notice('⚡ 正在转换...');
      }

      const html = await this.converter.convert(markdown);
      this.currentHtml = html;

      this.renderHTML(html);
      this.updateCurrentDoc();

      if (!silent) {
        new Notice('✅ 转换成功！');
      }
    } catch (error) {
      console.error('转换失败:', error);
      if (!silent) {
        new Notice('❌ 转换失败: ' + error.message);
      }
    }
  }

  /**
   * 渲染 HTML
   */
  renderHTML(html) {
    this.previewContainer.empty();
    this.previewContainer.innerHTML = html;
  }

  /**
   * 复制 HTML
   */
  async copyHTML() {
    if (!this.currentHtml) {
      new Notice('请先转换文档');
      return;
    }

    try {
      const text = this.previewContainer.textContent || '';

      // 尝试复制富文本
      if (navigator.clipboard && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([this.currentHtml], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        });

        await navigator.clipboard.write([clipboardItem]);
        new Notice('✅ HTML 已复制！可直接粘贴到公众号编辑器');
        return;
      }

      // 降级方案：选择内容
      const range = document.createRange();
      range.selectNodeContents(this.previewContainer);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const success = document.execCommand('copy');
      selection.removeAllRanges();

      if (success) {
        new Notice('✅ 内容已复制！可直接粘贴到公众号编辑器');
      } else {
        throw new Error('复制失败');
      }
    } catch (error) {
      console.error('复制失败:', error);
      new Notice('❌ 复制失败，请手动选择复制');
    }
  }

  async onClose() {
    // 清理容器（事件监听器由 Obsidian 自动管理）
    this.previewContainer?.empty();
    console.log('🍎 转换器面板已关闭');
  }
}

/**
 * 🍎 Apple Style 设置面板
 */
class AppleStyleSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '🍎 Apple Style 转换器设置' });

    containerEl.createEl('p', {
      text: '将 Markdown 转换为优雅的 Apple 风格 HTML，可直接粘贴到微信公众号等平台。',
      cls: 'setting-item-description'
    });

    // 字体大小
    new Setting(containerEl)
      .setName('默认字体大小')
      .setDesc('选择转换时使用的字体大小')
      .addDropdown(dropdown => dropdown
        .addOption('small', '小号 (适合手机)')
        .addOption('medium', '中号 (推荐)')
        .addOption('large', '大号 (适合大屏)')
        .setValue(this.plugin.settings.fontSize)
        .onChange(async (value) => {
          this.plugin.settings.fontSize = value;
          await this.plugin.saveSettings();
        })
      );

    // 水印功能
    containerEl.createEl('h3', { text: '🖼️ 图片水印设置' });

    // 启用水印
    new Setting(containerEl)
      .setName('启用图片水印')
      .setDesc('在每张图片上方显示头像水印')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableWatermark)
        .onChange(async (value) => {
          this.plugin.settings.enableWatermark = value;
          await this.plugin.saveSettings();
        })
      );

    // 头像 URL
    new Setting(containerEl)
      .setName('头像图片 URL')
      .setDesc('输入头像图片的完整 URL 地址')
      .addText(text => text
        .setPlaceholder('https://example.com/avatar.jpg')
        .setValue(this.plugin.settings.avatarUrl)
        .onChange(async (value) => {
          this.plugin.settings.avatarUrl = value;
          await this.plugin.saveSettings();
        })
      );

    // 设计说明
    containerEl.createEl('h3', { text: '🎨 设计特点' });

    const features = containerEl.createEl('div', {
      cls: 'apple-features',
    });

    const featureList = [
      '极简黑白灰配色系统 (#1d1d1f)',
      'San Francisco 系统字体栈',
      '8px 基准的间距设计',
      '1.8 行高提供舒适阅读体验',
      '圆角和柔和的视觉效果',
      '完美适配微信公众号编辑器'
    ];

    featureList.forEach(feature => {
      features.createEl('p', { text: '• ' + feature });
    });

    // 使用说明
    containerEl.createEl('h3', { text: '📖 使用方法' });

    const usage = containerEl.createEl('div', {
      cls: 'apple-usage',
    });

    usage.createEl('p', { text: '1. 打开需要转换的 Markdown 文件' });
    usage.createEl('p', { text: '2. 点击左侧边栏的 🍎 图标打开转换器' });
    usage.createEl('p', { text: '3. 选择合适的字体大小' });
    usage.createEl('p', { text: '4. 点击 "转换当前文档" 查看效果' });
    usage.createEl('p', { text: '5. 点击 "复制 HTML" 粘贴到公众号编辑器' });
  }
}

/**
 * 🍎 Apple Style 主插件
 */
class AppleStylePlugin extends Plugin {
  async onload() {
    console.log('🍎 正在加载 Apple Style Converter...');

    // 加载设置
    await this.loadSettings();

    // 注册视图
    this.registerView(
      APPLE_STYLE_VIEW,
      (leaf) => new AppleStyleView(leaf, this)
    );

    // 添加功能区图标
    this.addRibbonIcon('wand', '🍎 Apple 风格转换器', async () => {
      await this.openConverter();
    });

    // 添加命令
    this.addCommand({
      id: 'open-apple-converter',
      name: '打开 Apple 风格转换器',
      callback: async () => {
        await this.openConverter();
      },
    });

    this.addCommand({
      id: 'convert-to-apple-style',
      name: '转换为 Apple 风格 HTML',
      callback: async () => {
        const view = this.getConverterView();
        if (view) {
          await view.convertCurrent();
        } else {
          await this.openConverter();
          setTimeout(async () => {
            const view = this.getConverterView();
            if (view) {
              await view.convertCurrent();
            }
          }, 500);
        }
      },
    });

    // 添加设置面板
    this.addSettingTab(new AppleStyleSettingTab(this.app, this));

    console.log('✅ Apple Style Converter 加载完成');
  }

  /**
   * 打开转换器
   */
  async openConverter() {
    // 检查是否已打开
    let leaf = this.app.workspace.getLeavesOfType(APPLE_STYLE_VIEW)[0];

    if (!leaf) {
      // 在右侧创建新面板
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      await rightLeaf.setViewState({
        type: APPLE_STYLE_VIEW,
        active: true,
      });
      leaf = rightLeaf;
    }

    // 激活面板
    this.app.workspace.revealLeaf(leaf);
  }

  /**
   * 获取转换器视图
   */
  getConverterView() {
    const leaves = this.app.workspace.getLeavesOfType(APPLE_STYLE_VIEW);
    if (leaves.length > 0) {
      return leaves[0].view;
    }
    return null;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    console.log('🍎 Apple Style Converter 已卸载');
  }
}

module.exports = AppleStylePlugin;
