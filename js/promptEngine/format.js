function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function capitalizeFirst(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function joinNatural(blocks) {
  if (!blocks.length) return '';

  const connectors = {
    body: ', ',
    face: ', ',
    hair: ', ',
    makeup: ', ',
    clothing: ', wearing ',
    pose: ', ',
    scene: ', ',
    lighting: ', illuminated by ',
    camera: ', captured with ',
    multi: ', ',
  };

  // First block starts the sentence (style opener or identity)
  const parts = [];
  let isFirst = true;

  for (const block of blocks) {
    if (!block.text) continue;

    if (isFirst) {
      parts.push(block.text);
      isFirst = false;
      continue;
    }

    const connector = connectors[block.id] || ', ';
    if (connector.startsWith(', ')) {
      parts.push(connector.slice(2) + block.text);
    } else {
      parts.push(connector + block.text);
    }
  }

  // Join with natural flow — use commas within, "and" before last element
  if (parts.length <= 1) return parts.join('');
  if (parts.length === 2) return parts.join(' and ');

  return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
}

function rebuild(blocks, separator) {
  return blocks.map((block) => ({
    ...block,
    text: block.items.map((item) => item.text).filter(Boolean).join(separator),
  })).filter((block) => block.text);
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
          prompt = joinNatural(rebuild(working, separator));
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
