import { describe, it, expect } from 'vitest';
const {
  isStrictHtmlParity,
  findFirstDiffIndex,
  buildParityMismatchDetails,
} = require('../services/parity-gate');

describe('Parity Gate', () => {
  it('should require byte-level equality', () => {
    expect(isStrictHtmlParity('<p>a</p>', '<p>a</p>')).toBe(true);
    expect(isStrictHtmlParity('<p>a</p>', '<p>a</p>\n')).toBe(false);
    expect(isStrictHtmlParity('<p>a</p>', '<p>A</p>')).toBe(false);
  });

  it('should return first mismatch index', () => {
    expect(findFirstDiffIndex('abc', 'abc')).toBe(-1);
    expect(findFirstDiffIndex('abc', 'axc')).toBe(1);
    expect(findFirstDiffIndex('abc', 'ab')).toBe(2);
  });

  it('should provide mismatch snippets', () => {
    const details = buildParityMismatchDetails('<section>legacy</section>', '<section>native</section>', 12);
    expect(details.index).toBeGreaterThanOrEqual(9);
    expect(details.legacySnippet).toContain('legacy');
    expect(details.candidateSnippet).toContain('native');
  });
});
