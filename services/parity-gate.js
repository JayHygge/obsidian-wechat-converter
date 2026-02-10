function isStrictHtmlParity(legacyHtml, candidateHtml) {
  return String(legacyHtml || '') === String(candidateHtml || '');
}

function findFirstDiffIndex(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  const minLength = Math.min(left.length, right.length);
  for (let i = 0; i < minLength; i += 1) {
    if (left[i] !== right[i]) return i;
  }
  if (left.length !== right.length) return minLength;
  return -1;
}

function buildParityMismatchDetails(legacyHtml, candidateHtml, contextLength = 80) {
  const left = String(legacyHtml || '');
  const right = String(candidateHtml || '');
  const index = findFirstDiffIndex(left, right);

  if (index === -1) {
    return {
      index: -1,
      legacySnippet: '',
      candidateSnippet: '',
    };
  }

  const start = Math.max(0, index - contextLength);
  const endLeft = Math.min(left.length, index + contextLength);
  const endRight = Math.min(right.length, index + contextLength);

  return {
    index,
    legacySnippet: left.slice(start, endLeft),
    candidateSnippet: right.slice(start, endRight),
  };
}

module.exports = {
  isStrictHtmlParity,
  findFirstDiffIndex,
  buildParityMismatchDetails,
};
