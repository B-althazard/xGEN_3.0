export function normalizeTokens(tokens, rules) {
  const seen = new Set();
  return tokens.map((token) => {
    const canonicalValue = token.rawPromptValue.toLowerCase().replace(/[()]/g, '').replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
    const isDuplicate = seen.has(canonicalValue);
    seen.add(canonicalValue);
    const rewriteMap = rules.emphasisRules?.levels?.high?.rewriteMap || {};
    return {
      ...token,
      canonicalValue,
      isDuplicate,
      isComposite: canonicalValue.includes(',') || canonicalValue.split(' ').length > 3,
      rewrittenPromptValue: token.emphasisLevel === 'high' ? rewriteMap[canonicalValue] || token.rawPromptValue : token.rawPromptValue,
    };
  });
}
