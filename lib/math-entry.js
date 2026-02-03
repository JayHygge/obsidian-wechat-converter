import markdownItMathjax3 from 'markdown-it-mathjax3';


// Safely get global object
const _global = (typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {});

// Expose the plugin to the window object
_global.ObsidianWechatMath = (md, options) => {
    try {
        md.use(markdownItMathjax3, {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
            },
            svg: {
                fontCache: 'none', // Crucial for WeChat compatibility
                scale: 1,
                displayAlign: 'center',
                displayIndent: '0'
            },
            options: {
                enableMenu: false,
                assistiveMml: false
            }
        });
    } catch (e) {
        console.error('MathJax3 Plugin: Registration failed', e);
    }
};

