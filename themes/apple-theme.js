/**
 * 🍎 Apple 极简风格主题系统
 * 设计理念：克制、优雅、注重细节
 *
 * 特点：
 * - 极简黑白灰配色系统
 * - 充足的留白和呼吸感
 * - San Francisco 系统字体
 * - 圆角和柔和阴影
 * - 完美的排版比例
 */

class AppleTheme {
  /**
   * 🎨 配色系统 - 苹果官方配色
   */
  static COLORS = {
    // 核心配色
    primary: '#1d1d1f',        // 主文本 - 近黑色
    secondary: '#6e6e73',      // 次要文本 - 中灰
    tertiary: '#86868b',       // 三级文本 - 浅灰
    background: '#ffffff',     // 背景 - 纯白
    surface: '#f5f5f7',        // 表面 - 极浅灰

    // 强调色
    accent: '#0071e3',         // 苹果蓝
    accentHover: '#0077ed',    // 悬停蓝

    // 语义色
    success: '#34c759',        // 绿色
    warning: '#ff9500',        // 橙色
    error: '#ff3b30',          // 红色

    // 代码配色
    codeText: '#c7254e',       // 行内代码文本
    codeBg: '#f5f5f7',         // 行内代码背景
    codeBlockBg: '#fafafa',    // 代码块背景
    codeBlockBorder: '#e8e8ed',// 代码块边框

    // 边框和分隔线
    divider: '#d2d2d7',        // 分隔线
    border: '#e8e8ed',         // 边框
  };

  /**
   * 📏 字体大小系统 - 三套预设（优化后）
   */
  static FONT_SIZES = {
    // 小号 - 适合手机
    small: {
      base: 14,
      h1: 22,
      h2: 18,
      h3: 16,
      code: 12,
      caption: 12,
    },

    // 中号 - 推荐
    medium: {
      base: 16,
      h1: 28,
      h2: 21,
      h3: 18,
      code: 14,
      caption: 13,
    },

    // 大号 - 适合大屏
    large: {
      base: 18,
      h1: 32,
      h2: 24,
      h3: 20,
      code: 16,
      caption: 14,
    },
  };

  /**
   * 🔤 字体栈 - San Francisco 风格
   */
  static FONTS = {
    text: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif`,
    code: `'SF Mono', 'Menlo', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
    display: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif`,
  };

  /**
   * 📐 间距系统 - 8px 基准
   */
  static SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };

  /**
   * 🎯 圆角系统
   */
  static RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  };

  /**
   * 获取元素样式
   * @param {string} tagName - HTML 标签名
   * @param {string} fontSize - 字体大小档位 (small/medium/large)
   * @returns {string} - CSS 样式字符串
   */
  static getStyle(tagName, fontSize = 'medium') {
    const sizes = this.FONT_SIZES[fontSize];
    const c = this.COLORS;
    const f = this.FONTS;
    const s = this.SPACING;
    const r = this.RADIUS;

    const styles = {
      // === 容器 ===
      'section': `
        font-family: ${f.text};
        font-size: ${sizes.base}px;
        line-height: 1.8;
        color: ${c.primary};
        padding: ${s.md}px;
        background: ${c.background};
        max-width: 100%;
        word-wrap: break-word;
      `,

      // === 标题系列 - 优化后的三级标题系统 ===
      // H1 - 主要章节（28px, 700粗体, 灰色下划线）
      'h1': `
        font-family: ${f.text};
        font-size: ${sizes.h1}px;
        font-weight: 700;
        color: ${c.primary};
        line-height: 1.4;
        letter-spacing: -0.3px;
        margin: ${s.xxl}px 0 ${s.lg}px 0;
        padding: 0 0 ${s.sm}px 0;
        border-bottom: 1px solid ${c.divider};
      `,

      // H2 - 次级章节（21px, 600中粗, 短下划线）
      'h2': `
        font-family: ${f.text};
        font-size: ${sizes.h2}px;
        font-weight: 600;
        color: ${c.primary};
        line-height: 1.5;
        letter-spacing: -0.2px;
        margin: ${s.xl}px 0 ${s.md}px 0;
        padding: 0 0 ${s.sm}px 0;
        border-bottom: 1px solid ${c.divider};
        display: inline-block;
      `,

      // H3 - 小节标题（18px, 500中等, 无装饰）
      'h3': `
        font-family: ${f.text};
        font-size: ${sizes.h3}px;
        font-weight: 500;
        color: ${c.primary};
        line-height: 1.6;
        margin: ${s.lg}px 0 12px 0;
        padding: 0;
      `,

      // === 段落 - 书籍风格 ===
      'p': `
        font-size: ${sizes.base}px;
        line-height: 1.8;
        color: ${c.primary};
        margin: 0 0 12px 0;
        padding: 0;
        letter-spacing: 0.02em;
      `,

      // === 引用块 - 低调的辅助内容 ===
      'blockquote': `
        font-size: ${sizes.base}px;
        line-height: 1.8;
        color: ${c.secondary};
        background: ${c.surface};
        margin: ${s.sm}px 0;
        padding: ${s.sm}px ${s.md}px;
        border-left: 3px solid ${c.divider};
        border-radius: 0 ${r.sm}px ${r.sm}px 0;
      `,

      // === 代码 - 专业的展示 ===
      'pre': `
        background: ${c.codeBlockBg};
        border: 1px solid ${c.codeBlockBorder};
        border-radius: ${r.md}px;
        padding: ${s.sm}px ${s.md}px;
        margin: ${s.sm}px 0;
        overflow-x: auto;
        font-family: ${f.code};
        font-size: ${sizes.code}px;
        line-height: 1.6;
        color: ${c.primary};
      `,

      'code': `
        background: ${c.codeBg};
        color: ${c.codeText};
        padding: 2px 6px;
        border-radius: ${r.sm}px;
        font-family: ${f.code};
        font-size: ${sizes.code}px;
        font-weight: 500;
      `,

      // === 列表 - 清晰的层次 ===
      'ul': `
        margin: 0;
        padding-left: ${s.lg}px;
        list-style-type: disc;
      `,

      'ol': `
        margin: 0;
        padding-left: ${s.lg}px;
        list-style-type: decimal;
      `,

      'li': `
        font-size: ${sizes.base}px;
        line-height: 1.4;
        color: ${c.primary};
        margin: 0 0 2px 0;
        padding: 0;
      `,

      // 列表项内的段落（去掉 padding）
      'li p': `
        margin: 0;
        padding: 0;
        line-height: 1.4;
      `,

      // === 图片 - 优美的展示 ===
      // 图片容器（灰色边框）
      'figure': `
        border: 2px solid ${c.divider};
        border-radius: ${r.md}px;
        padding: ${s.md}px;
        margin: ${s.md}px 0;
        background: ${c.background};
      `,

      // 头像+标题容器（横向布局，公众号兼容）
      'avatar-header': `
        margin: 0 0 ${s.sm}px 0;
        overflow: hidden;
      `,

      // 头像水印样式（用 float 实现横向）
      'avatar': `
        width: 28px !important;
        max-width: 28px !important;
        height: 28px !important;
        max-height: 28px !important;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid ${c.border};
        float: left;
        margin-right: ${s.sm}px;
      `,

      // 图片标题（左对齐，配合头像横向显示）
      'figcaption': `
        font-size: ${sizes.caption}px;
        color: ${c.secondary};
        text-align: left;
        margin: 0;
        padding: 0;
        font-weight: 500;
        line-height: 28px;
        overflow: hidden;
      `,

      // 图片本身
      'img': `
        max-width: 100%;
        height: auto;
        border-radius: ${r.sm}px;
        margin: 0;
        display: block;
      `,

      // === 链接 - 标志性的蓝色 ===
      'a': `
        color: ${c.accent};
        text-decoration: none;
        transition: color 0.2s ease;
      `,

      'a:hover': `
        color: ${c.accentHover};
        text-decoration: underline;
      `,

      // === 表格 - 简洁专业 ===
      'table': `
        width: 100%;
        border-collapse: collapse;
        margin: ${s.sm}px 0;
        font-size: ${sizes.base - 1}px;
      `,

      'thead': `
        background: ${c.surface};
      `,

      'th': `
        padding: ${s.xs}px ${s.sm}px;
        text-align: left;
        font-weight: 600;
        color: ${c.primary};
        border-bottom: 2px solid ${c.divider};
      `,

      'td': `
        padding: ${s.xs}px ${s.sm}px;
        color: ${c.primary};
        border-bottom: 1px solid ${c.border};
      `,

      'tr:last-child td': `
        border-bottom: none;
      `,

      // === 分隔线 - 书籍分段标记（不可见，仅产生间距） ===
      'hr': `
        border: none !important;
        border-top: none !important;
        height: 0 !important;
        margin: ${s.lg}px 0 !important;
        opacity: 0 !important;
        background: none !important;
      `,

      // === 强调 ===
      'strong': `
        font-weight: 600;
        color: ${c.primary};
      `,

      'em': `
        font-style: italic;
        color: ${c.secondary};
      `,

      'mark': `
        background: #ffec99;
        color: ${c.primary};
        padding: 2px 4px;
        border-radius: ${r.sm}px;
      `,

      // === 删除线 ===
      'del': `
        color: ${c.tertiary};
        text-decoration: line-through;
      `,
    };

    return styles[tagName] || '';
  }

  /**
   * 生成完整的 CSS 样式表
   * @param {string} fontSize - 字体大小档位
   * @returns {string} - 完整的 CSS
   */
  static generateCSS(fontSize = 'medium') {
    const tags = [
      'section', 'h1', 'h2', 'h3',
      'p', 'blockquote', 'pre', 'code',
      'ul', 'ol', 'li', 'figure', 'figcaption', 'img', 'a', 'table',
      'thead', 'th', 'td', 'hr', 'strong', 'em', 'mark', 'del'
    ];

    let css = '';

    tags.forEach(tag => {
      const style = this.getStyle(tag, fontSize);
      if (style) {
        css += `.apple-style ${tag} { ${style.trim().replace(/\n\s+/g, ' ')} }\n`;
      }
    });

    // 添加链接悬停效果
    css += `.apple-style a:hover { ${this.getStyle('a:hover', fontSize).trim().replace(/\n\s+/g, ' ')} }\n`;

    // 添加表格最后一行样式
    css += `.apple-style tr:last-child td { ${this.getStyle('tr:last-child td', fontSize).trim().replace(/\n\s+/g, ' ')} }\n`;

    return css;
  }

  /**
   * 获取主题信息
   */
  static getThemeInfo() {
    return {
      name: 'Apple Style',
      version: '1.0.0',
      description: '优雅的苹果风格排版主题',
      author: 'Apple Style Team',
      colors: this.COLORS,
      fonts: this.FONTS,
      spacing: this.SPACING,
      radius: this.RADIUS,
    };
  }
}

// 导出到全局作用域
window.AppleTheme = AppleTheme;
