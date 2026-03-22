function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function rebuild(blocks, separator) {
  return blocks.map((block) => ({ ...block, text: block.items.map((item) => item.text).filter(Boolean).join(separator) })).filter((block) => block.text);
}

export function formatPositivePrompt(blocks, rules) {
  const separator = rules.formatting?.separator || ', ';
  const working = blocks.map((block) => ({ ...block, items: [...(block.items || [])] }));
  let prompt = rebuild(working, separator).map((block) => block.text).join(separator);
  const pruneOrder = rules.lengthBudget?.pruneOrder || [];
  const neverPrune = new Set(rules.lengthBudget?.neverPrune || []);

  if (countWords(prompt) > (rules.lengthBudget?.softMaxWords || 110)) {
    for (const domain of pruneOrder) {
      for (const block of working) {
        const index = block.items.findIndex((item) => item.domain === domain && !neverPrune.has(item.domain));
        if (index >= 0) {
          block.items.splice(index, 1);
          prompt = rebuild(working, separator).map((entry) => entry.text).join(separator);
          if (countWords(prompt) <= (rules.lengthBudget?.softMaxWords || 110)) break;
        }
      }
      if (countWords(prompt) <= (rules.lengthBudget?.softMaxWords || 110)) break;
    }
  }

  if (countWords(prompt) > (rules.lengthBudget?.hardMaxWords || 140)) {
    prompt = prompt.trim().split(/\s+/).slice(0, rules.lengthBudget?.hardMaxWords || 140).join(' ');
  }
  return prompt;
}
