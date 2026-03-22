function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function joinNatural(blocks) {
  const prefixes = {
    scene: 'in ',
    lighting: 'with ',
    camera: 'shot with ',
  };
  const parts = [];
  for (const block of blocks) {
    if (!block.text) continue;
    const prefix = prefixes[block.id] || '';
    parts.push(prefix + block.text);
  }
  if (parts.length <= 1) return parts.join('');
  return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
}

function rebuild(blocks, separator) {
  return blocks.map((block) => ({ ...block, text: block.items.map((item) => item.text).filter(Boolean).join(separator) })).filter((block) => block.text);
}

export function formatPositivePrompt(blocks, rules, settings = {}) {
  const separator = rules.formatting?.separator || ', ';
  const working = blocks.map((block) => ({ ...block, items: [...(block.items || [])] }));

  let prompt = joinNatural(rebuild(working, separator));

  const aesthetic = settings.aesthetic;
  if (aesthetic != null && aesthetic >= 6 && aesthetic <= 10) {
    prompt = `aesthetic ${aesthetic}, ${prompt}`;
  }
  const pruneOrder = rules.lengthBudget?.pruneOrder || [];
  const neverPrune = new Set(rules.lengthBudget?.neverPrune || []);

  if (countWords(prompt) > (rules.lengthBudget?.softMaxWords || 256)) {
    for (const domain of pruneOrder) {
      for (const block of working) {
        const index = block.items.findIndex((item) => item.domain === domain && !neverPrune.has(item.domain));
        if (index >= 0) {
          block.items.splice(index, 1);
          prompt = rebuild(working, separator).map((entry) => entry.text).join(separator);
          if (countWords(prompt) <= (rules.lengthBudget?.softMaxWords || 256)) break;
        }
      }
      if (countWords(prompt) <= (rules.lengthBudget?.softMaxWords || 256)) break;
    }
  }

  if (countWords(prompt) > (rules.lengthBudget?.hardMaxWords || 512)) {
    prompt = prompt.trim().split(/\s+/).slice(0, rules.lengthBudget?.hardMaxWords || 512).join(' ');
  }
  return prompt;
}
