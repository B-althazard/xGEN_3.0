export function collectMetadata(positivePrompt, blocks, keptTokens, droppedTokens, settings) {
  const words = positivePrompt.trim() ? positivePrompt.trim().split(/\s+/) : [];
  return {
    wordCount: words.length,
    tokenCountEstimate: Math.ceil(words.length * 1.33),
    characterCount: positivePrompt.length,
    realismMode: settings.realismMode,
    negativeMode: settings.negativeMode,
    appliedRuleIds: droppedTokens.map((token) => token.resolution).filter(Boolean),
    warnings: words.length > 110 ? ['Prompt too long - model performance may degrade'] : [],
  };
}

export function validateFields() {
  return [];
}
