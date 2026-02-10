const { isStrictHtmlParity, buildParityMismatchDetails } = require('./parity-gate');

class LegacyRenderPipeline {
  constructor(converter) {
    this.converter = converter;
  }

  async renderForPreview(markdown, context = {}) {
    if (!this.converter || typeof this.converter.convert !== 'function') {
      throw new Error('Legacy converter is not ready');
    }

    if (typeof this.converter.updateSourcePath === 'function') {
      this.converter.updateSourcePath(context.sourcePath || '');
    }

    return this.converter.convert(markdown);
  }

  async renderForExport(markdown, context = {}) {
    return {
      html: await this.renderForPreview(markdown, context),
      diagnostics: [],
    };
  }
}

class NativeRenderPipeline {
  constructor({ nativeRenderer, legacyPipeline, getFlags }) {
    this.nativeRenderer = nativeRenderer;
    this.legacyPipeline = legacyPipeline;
    this.getFlags = typeof getFlags === 'function' ? getFlags : () => ({});
  }

  async renderForPreview(markdown, context = {}) {
    const flags = this.getFlags() || {};
    const strictParity = flags.enforceNativeParity === true;
    const parityTransform = typeof flags.parityTransform === 'function' ? flags.parityTransform : null;

    // Phase 1 behavior freeze: if native renderer is not implemented,
    // fallback to legacy path by default.
    if (typeof this.nativeRenderer !== 'function') {
      if (flags.enableLegacyFallback !== false && this.legacyPipeline) {
        return this.legacyPipeline.renderForPreview(markdown, context);
      }
      throw new Error('Native render pipeline is not implemented yet');
    }

    try {
      const nativeHtml = await this.nativeRenderer(markdown, context);

      if (!strictParity || !this.legacyPipeline) {
        return nativeHtml;
      }

      const legacyHtml = await this.legacyPipeline.renderForPreview(markdown, context);
      const parityLegacyHtml = parityTransform
        ? parityTransform(legacyHtml, { markdown, context, pipeline: 'legacy' })
        : legacyHtml;
      const parityNativeHtml = parityTransform
        ? parityTransform(nativeHtml, { markdown, context, pipeline: 'native' })
        : nativeHtml;

      if (isStrictHtmlParity(parityLegacyHtml, parityNativeHtml)) {
        return nativeHtml;
      }

      const mismatch = buildParityMismatchDetails(parityLegacyHtml, parityNativeHtml);
      const parityError = new Error(
        `[RenderPipeline] Parity mismatch at index ${mismatch.index}`
      );
      parityError.code = 'PARITY_MISMATCH';
      parityError.parity = mismatch;

      if (typeof flags.onParityMismatch === 'function') {
        flags.onParityMismatch({
          markdown,
          context,
          mismatch,
        });
      }

      if (flags.enableLegacyFallback !== false && this.legacyPipeline) {
        console.warn('[RenderPipeline] Native parity mismatch, fallback to legacy:', mismatch.index);
        return legacyHtml;
      }

      throw parityError;
    } catch (error) {
      if (flags.enableLegacyFallback !== false && this.legacyPipeline) {
        console.warn('[RenderPipeline] Native render failed, fallback to legacy:', error?.message || error);
        return this.legacyPipeline.renderForPreview(markdown, context);
      }
      throw error;
    }
  }

  async renderForExport(markdown, context = {}) {
    return {
      html: await this.renderForPreview(markdown, context),
      diagnostics: [],
    };
  }
}

function createRenderPipelines({ converter, getFlags, nativeRenderer }) {
  const legacyPipeline = new LegacyRenderPipeline(converter);
  const nativePipeline = new NativeRenderPipeline({
    nativeRenderer,
    legacyPipeline,
    getFlags,
  });

  return { legacyPipeline, nativePipeline };
}

module.exports = {
  LegacyRenderPipeline,
  NativeRenderPipeline,
  createRenderPipelines,
};
