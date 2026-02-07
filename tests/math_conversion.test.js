import { describe, it, expect, beforeEach, vi } from 'vitest';

// 1. Mock Obsidian & DOM Environment
vi.mock('obsidian', () => ({
  Notice: class {
    setMessage() {}
    hide() {}
  },
  requestUrl: vi.fn(),
}));

const { AppleStyleView } = require('../input.js');

describe('AppleStyleView - Math Formula Processing', () => {
  let view;
  let mockApi;

  beforeEach(() => {
    view = new AppleStyleView(null, null);

    // Mock the WechatAPI object
    mockApi = {
      uploadImage: vi.fn().mockResolvedValue({ url: 'http://weixin.qq.com/math.png' })
    };

    // Mock svgToPngBlob (Critical: bypass Canvas requirement)
    // We attach it to the instance because it's a method of the class
    // Corrected mock structure to match implementation contract { blob, width, height, style }
    view.svgToPngBlob = vi.fn().mockResolvedValue({
        blob: new Blob(['fake-png'], { type: 'image/png' }),
        width: 100,
        height: 20,
        style: 'vertical-align: -1px;'
    });
  });

  it('should skip processing if no math formulas exist', async () => {
    const inputHtml = '<div><p>No math here</p></div>';

    const outputHtml = await view.processMathFormulas(inputHtml, mockApi);

    expect(outputHtml).toBe(inputHtml);
    expect(view.svgToPngBlob).not.toHaveBeenCalled();
    expect(mockApi.uploadImage).not.toHaveBeenCalled();
  });

  it('should process a single math formula', async () => {
    // Construct HTML simulating MathJax output
    // MathJax usually wraps SVG in mjx-container
    const inputHtml = `
      <div>
        <p>Formula:</p>
        <mjx-container class="MathJax" jax="SVG">
          <svg viewBox="0 0 100 20" width="10ex" height="2ex"></svg>
        </mjx-container>
      </div>
    `;

    const outputHtml = await view.processMathFormulas(inputHtml, mockApi);

    // 1. Check if conversion was attempted
    expect(view.svgToPngBlob).toHaveBeenCalledTimes(1);

    // 2. Check if upload was attempted
    expect(mockApi.uploadImage).toHaveBeenCalledTimes(1);

    // 3. Check if DOM was replaced
    expect(outputHtml).toContain('<img');
    expect(outputHtml).toContain('src="http://weixin.qq.com/math.png"');
    expect(outputHtml).not.toContain('<svg'); // SVG should be gone
    expect(outputHtml).toContain('class="math-formula-image"');

    // Verify dimension attributes (from mock return values)
    expect(outputHtml).toContain('width="100"');
    expect(outputHtml).toContain('height="20"');
  });

  it('should process multiple formulas concurrently', async () => {
    const inputHtml = `
      <div>
        <mjx-container><svg id="eq1"></svg></mjx-container>
        <p>Text</p>
        <mjx-container><svg id="eq2"></svg></mjx-container>
      </div>
    `;

    const outputHtml = await view.processMathFormulas(inputHtml, mockApi);

    expect(view.svgToPngBlob).toHaveBeenCalledTimes(2);
    expect(mockApi.uploadImage).toHaveBeenCalledTimes(2);

    // Should contain two images
    const matches = outputHtml.match(/<img/g);
    expect(matches.length).toBe(2);
  });

  it('should handle upload failures gracefully (keep original SVG)', async () => {
    // Simulate upload failure for the first call
    view.svgToPngBlob.mockRejectedValueOnce(new Error('Canvas failed'));

    const inputHtml = `
      <div>
        <mjx-container><svg id="broken"></svg></mjx-container>
      </div>
    `;

    // Mock console.error to keep test output clean
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const outputHtml = await view.processMathFormulas(inputHtml, mockApi);

    // Should still contain SVG because conversion failed
    expect(outputHtml).toContain('<svg');
    expect(outputHtml).not.toContain('<img');

    spyConsole.mockRestore();
  });

  it('should preserve inline styles from mjx-container', async () => {
    const inputHtml = `
      <mjx-container style="vertical-align: -0.5ex; margin: 10px;">
        <svg></svg>
      </mjx-container>
    `;

    const outputHtml = await view.processMathFormulas(inputHtml, mockApi);

    // The img tag should inherit styles, appended to our default styles
    expect(outputHtml).toContain('style="display: inline-block; margin: 0 2px;vertical-align: -0.5ex; margin: 10px;"');
  });

  // === New Tests for Cache & Side Effects ===

  it('should use cache for identical formulas (avoiding duplicate uploads)', async () => {
    // 1. First call: Should upload
    const inputHtml1 = '<div><svg id="eq1" width="100" height="20" style="color:red"></svg></div>';

    await view.processMathFormulas(inputHtml1, mockApi);
    expect(mockApi.uploadImage).toHaveBeenCalledTimes(1);

    // 2. Second call: Should use cache (0 uploads)
    mockApi.uploadImage.mockClear(); // Reset count

    const outputHtml2 = await view.processMathFormulas(inputHtml1, mockApi);

    expect(mockApi.uploadImage).not.toHaveBeenCalled(); // Should match cache
    expect(outputHtml2).toContain('<img'); // But still return replaced HTML
  });

  it('should clone the SVG node before processing (prevent side effects)', async () => {
    // 1. Setup a real DOM node
    const svg = document.createElement('svg');
    svg.setAttribute('role', 'img'); // Mark as MathJax
    svg.setAttribute('fill', 'original-color');

    // Spy on cloneNode to ensure we are operating on a copy
    const cloneSpy = vi.spyOn(svg, 'cloneNode');

    // Access the REAL method from prototype
    const realMethod = AppleStyleView.prototype.svgToPngBlob;

    // 2. Mock necessary Browser APIs using vi.stubGlobal for cleaner restoration
    vi.stubGlobal('XMLSerializer', class {
        serializeToString() { return '<svg>...</svg>'; }
    });

    // Use spies for existing globals if possible, or stub if they are readonly/missing in jsdom
    // jsdom has URL, so we spy on createObjectURL
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Mock Canvas
    const mockCanvas = {
        getContext: vi.fn(() => ({
            scale: vi.fn(),
            drawImage: vi.fn()
        })),
        toBlob: vi.fn((cb) => cb(new Blob(['img'], { type: 'image/png' })))
    };

    // Stub createElement to intercept canvas creation
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') return mockCanvas;
        // For other tags, we should ideally call original, but jsdom's createElement is complex.
        // We know svgToPngBlob only creates 'canvas' explicitly.
        return {
            style: {},
            getContext: mockCanvas.getContext,
            toBlob: mockCanvas.toBlob,
            setAttribute: () => {},
            cloneNode: () => ({}),
        };
    });

    // Critical: Mock Image to trigger onload immediately
    const OriginalImage = global.Image;
    vi.stubGlobal('Image', class {
        constructor() {
            setTimeout(() => {
                if (this.onload) this.onload();
            }, 0);
        }
        set src(val) { this._src = val; }
        get src() { return this._src; }
    });

    try {
        await realMethod.call(view, svg);
    } finally {
        // Restore everything
        vi.unstubAllGlobals(); // Restores XMLSerializer, Image
        vi.restoreAllMocks();  // Restores URL, document.createElement
    }

    // 3. Verify cloneNode was called with deep=true
    expect(cloneSpy).toHaveBeenCalledWith(true);

    // 4. Verify the original node was NOT modified
    expect(svg.getAttribute('fill')).toBe('original-color');
  });
});
