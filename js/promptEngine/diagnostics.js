const VAGUE_TERMS = ['nice', 'good', 'beautiful', 'pretty', 'great', 'lovely', 'amazing', 'awesome', 'perfect', 'stunning'];
const NEGATION_WORDS = ['no ', 'without', 'not ', "don't", "doesn't", 'never', 'none', 'nothing', 'nobody'];
const FLUX_TOKEN_LIMIT = 512;

export function collectMetadata(positivePrompt, blocks, keptTokens, droppedTokens, settings) {
  const words = positivePrompt.trim() ? positivePrompt.trim().split(/\s+/) : [];
  const tokenEstimate = Math.ceil(words.length * 1.33);
  const warnings = [];

  // FLUX token budget
  if (tokenEstimate > FLUX_TOKEN_LIMIT) {
    warnings.push(`Prompt exceeds FLUX 512 token limit (est. ${tokenEstimate} tokens)`);
  } else if (tokenEstimate > FLUX_TOKEN_LIMIT * 0.9) {
    warnings.push(`Prompt approaching FLUX token limit (est. ${tokenEstimate}/512 tokens)`);
  }

  // Word order quality — check if subject/identity comes in first 30% of prompt
  const firstThird = positivePrompt.substring(0, Math.floor(positivePrompt.length * 0.3)).toLowerCase();
  if (blocks.length > 1 && !firstThird.includes('woman') && !firstThird.includes('man') && !firstThird.includes('person') && !firstThird.includes('photograph')) {
    warnings.push('Subject may not be front-loaded — FLUX pays more attention to early words');
  }

  // Specificity check — flag vague terms
  const lowerPrompt = positivePrompt.toLowerCase();
  const foundVague = VAGUE_TERMS.filter((term) => lowerPrompt.includes(term));
  if (foundVague.length) {
    warnings.push(`Vague terms detected: ${foundVague.join(', ')} — replace with specific descriptors`);
  }

  // Negation check — FLUX doesn't support negatives
  const foundNegation = NEGATION_WORDS.filter((word) => lowerPrompt.includes(word));
  if (foundNegation.length) {
    warnings.push(`Negation detected — FLUX ignores negatives. Describe what you want instead.`);
  }

  // Empty blocks
  const emptyBlocks = blocks.filter((b) => !b.text || !b.text.trim()).map((b) => b.id);
  if (emptyBlocks.length && blocks.length > 2) {
    warnings.push(`Empty blocks: ${emptyBlocks.join(', ')}`);
  }

  return {
    wordCount: words.length,
    tokenCountEstimate: tokenEstimate,
    characterCount: positivePrompt.length,
    realismMode: settings.realismMode,
    negativeMode: settings.negativeMode,
    appliedRuleIds: droppedTokens.map((token) => token.resolution).filter(Boolean),
    warnings,
  };
}

export function validateFields() {
  return [];
}
