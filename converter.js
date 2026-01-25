/**
 * 🍎 Apple Style Markdown 转换器
 * 将 Markdown 转换为带内联样式的 HTML
 */

class AppleStyleConverter {
  constructor(theme, fontSize = 'medium', avatarUrl = '') {
    this.theme = theme;
    this.fontSize = fontSize;
    this.avatarUrl = avatarUrl;
    this.md = null;
  }

  /**
   * 初始化 markdown-it
   */
  async initMarkdownIt() {
    if (this.md) return;

    // markdown-it 已通过 script 标签加载
    if (typeof markdownit === 'undefined') {
      throw new Error('markdown-it 未加载');
    }

    this.md = markdownit({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
    });

    // 自定义渲染规则
    this.setupRenderRules();
  }

  /**
   * 设置渲染规则 - 添加内联样式
   */
  setupRenderRules() {
    const defaultRender = this.md.renderer.rules;

    // 段落
    this.md.renderer.rules.paragraph_open = () => {
      return `<p style="${this.getInlineStyle('p')}">`;
    };

    // 标题
    for (let i = 1; i <= 6; i++) {
      this.md.renderer.rules[`heading_open`] = (tokens, idx) => {
        const level = tokens[idx].tag;
        return `<${level} style="${this.getInlineStyle(level)}">`;
      };
    }

    // 引用块
    this.md.renderer.rules.blockquote_open = () => {
      return `<blockquote style="${this.getInlineStyle('blockquote')}">`;
    };

    // 列表
    this.md.renderer.rules.bullet_list_open = () => {
      return `<ul style="${this.getInlineStyle('ul')}">`;
    };

    this.md.renderer.rules.ordered_list_open = () => {
      return `<ol style="${this.getInlineStyle('ol')}">`;
    };

    this.md.renderer.rules.list_item_open = () => {
      return `<li style="${this.getInlineStyle('li')}">`;
    };

    // 代码
    this.md.renderer.rules.code_inline = (tokens, idx) => {
      const content = tokens[idx].content;
      return `<code style="${this.getInlineStyle('code')}">${this.escapeHtml(content)}</code>`;
    };

    this.md.renderer.rules.fence = (tokens, idx) => {
      const content = tokens[idx].content;
      const lang = tokens[idx].info || '';
      return `<pre style="${this.getInlineStyle('pre')}"><code>${this.escapeHtml(content)}</code></pre>`;
    };

    // 链接
    this.md.renderer.rules.link_open = (tokens, idx) => {
      const href = tokens[idx].attrGet('href');
      return `<a href="${href}" style="${this.getInlineStyle('a')}">`;
    };

    // 强调
    this.md.renderer.rules.strong_open = () => {
      return `<strong style="${this.getInlineStyle('strong')}">`;
    };

    this.md.renderer.rules.em_open = () => {
      return `<em style="${this.getInlineStyle('em')}">`;
    };

    // 图片 - 使用 figure 和 figcaption 包装，带头像水印
    this.md.renderer.rules.image = (tokens, idx) => {
      const src = tokens[idx].attrGet('src');
      const alt = tokens[idx].content;

      // 提取图片名称（从 src 中提取文件名，如果 alt 为空的话）
      const caption = alt || this.extractFileName(src);

      // 如果设置了头像，显示头像+标题的横向布局
      if (this.avatarUrl) {
        return `
          <figure style="${this.getInlineStyle('figure')}">
            <div style="${this.getInlineStyle('avatar-header')}">
              <img src="${this.avatarUrl}" alt="logo" style="${this.getInlineStyle('avatar')}">
              <figcaption style="${this.getInlineStyle('figcaption')}">${caption}</figcaption>
            </div>
            <img src="${src}" alt="${alt}" style="${this.getInlineStyle('img')}">
          </figure>
        `.trim();
      }

      // 没有头像时保持原有布局
      return `
        <figure style="${this.getInlineStyle('figure')}">
          <figcaption style="${this.getInlineStyle('figcaption')}">${caption}</figcaption>
          <img src="${src}" alt="${alt}" style="${this.getInlineStyle('img')}">
        </figure>
      `.trim();
    };

    // 水平线
    this.md.renderer.rules.hr = () => {
      return `<hr style="${this.getInlineStyle('hr')}">`;
    };

    // 表格
    this.md.renderer.rules.table_open = () => {
      return `<table style="${this.getInlineStyle('table')}">`;
    };

    this.md.renderer.rules.thead_open = () => {
      return `<thead style="${this.getInlineStyle('thead')}">`;
    };

    this.md.renderer.rules.th_open = () => {
      return `<th style="${this.getInlineStyle('th')}">`;
    };

    this.md.renderer.rules.td_open = () => {
      return `<td style="${this.getInlineStyle('td')}">`;
    };
  }

  /**
   * 获取内联样式
   */
  getInlineStyle(tagName) {
    const style = this.theme.getStyle(tagName, this.fontSize);
    // 清理样式：移除换行和多余空格
    return style
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 转换 Markdown 为 HTML
   */
  async convert(markdown) {
    await this.initMarkdownIt();

    // 转换 Markdown
    let html = this.md.render(markdown);

    // 后处理：修复列表内段落的样式
    html = this.fixListParagraphs(html);

    // 包装到容器中
    html = `<section style="${this.getInlineStyle('section')}">${html}</section>`;

    return html;
  }

  /**
   * 修复列表内段落的样式（去掉 padding）
   */
  fixListParagraphs(html) {
    // 匹配 <li>...</li> 内的 <p style="...">
    // 将列表内的段落样式改为紧凑样式
    const liPStyle = this.getInlineStyle('li p');

    // 使用正则表达式替换列表项内的段落样式
    html = html.replace(/<li[^>]*>[\s\S]*?<\/li>/g, (liMatch) => {
      // 在这个 li 内部替换所有的 p 标签样式
      return liMatch.replace(/<p style="[^"]*">/g, `<p style="${liPStyle}">`);
    });

    return html;
  }

  /**
   * 转义 HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 从文件路径中提取文件名
   */
  extractFileName(src) {
    if (!src) return '图片';

    // 提取文件名（去除路径）
    const fileName = src.split('/').pop().split('\\').pop();

    // 去除文件扩展名
    const nameWithoutExt = fileName.replace(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i, '');

    return nameWithoutExt || '图片';
  }
}

// 导出到全局作用域
window.AppleStyleConverter = AppleStyleConverter;
