function drop(token, reason) {
  token.status = 'dropped';
  token.resolution = reason;
}

function ruleMatches(rule, fields) {
  const all = rule.whenAll || [];
  const exists = rule.whenExists || [];
  const allMatched = all.every((condition) => {
    const value = fields[condition.fieldId];
    if (Object.prototype.hasOwnProperty.call(condition, 'equals')) return value === condition.equals;
    if (Object.prototype.hasOwnProperty.call(condition, 'notEquals')) return value !== condition.notEquals;
    return false;
  });
  const existsMatched = exists.every((fieldId) => {
    const value = fields[fieldId];
    return Array.isArray(value) ? value.length > 0 : value != null && value !== '';
  });
  return allMatched && existsMatched;
}

function domainMatches(token, domains = [], prefixes = []) {
  return domains.includes(token.domain) || prefixes.some((prefix) => token.domain.startsWith(prefix));
}

export function resolveTokens(tokens, rules, fields = {}) {
  const resolved = tokens.map((token) => ({ ...token }));

  for (const rule of rules.conflicts?.rules || []) {
    if (!ruleMatches(rule, fields)) continue;
    resolved.forEach((token) => {
      if (rule.exceptDomains?.includes(token.domain)) return;
      if (domainMatches(token, rule.dropDomains || [], rule.dropPrefixes || [])) {
        drop(token, rule.id);
      }
    });
  }

  const byDomain = new Map();
  resolved.forEach((token) => {
    if (!byDomain.has(token.domain)) byDomain.set(token.domain, []);
    byDomain.get(token.domain).push(token);
  });

  for (const [domain, list] of byDomain.entries()) {
    if (list.length > 1 && !domain.endsWith('.style') && !domain.endsWith('.detail') && !domain.endsWith('.state') && !domain.includes('effects') && !domain.includes('color')) {
      const winner = [...list].sort((a, b) => b.sourceOrder.optionIndex - a.sourceOrder.optionIndex)[0];
      list.filter((token) => token !== winner).forEach((token) => drop(token, 'single-select dominance'));
    }
  }

  for (const [domain, order] of Object.entries(rules.dominance?.ladders || {})) {
    const list = resolved.filter((token) => token.domain === domain && token.status !== 'dropped');
    if (list.length < 2) continue;
    const winner = [...list].sort((a, b) => order.indexOf(b.optionId) - order.indexOf(a.optionId))[0];
    list.filter((token) => token !== winner).forEach((token) => drop(token, `${domain} ladder`));
  }

  const present = (needle) => resolved.find((token) => token.status !== 'dropped' && token.canonicalValue.includes(needle));
  for (const pair of rules.redundancy?.pairs || []) {
    if (present(pair.winner) && present(pair.loser)) {
      resolved.forEach((token) => {
        if (token.canonicalValue === pair.loser) drop(token, `${pair.winner} > ${pair.loser}`);
      });
    }
  }
  if ((present('freckles') || present('scars') || present('stretch marks') || present('visible veins')) && present('smooth flawless skin')) {
    resolved.forEach((token) => {
      if (token.canonicalValue === 'smooth flawless skin') drop(token, 'contradictory surface logic');
    });
  }
  if ((present('spread open pussy') || present('gaping wide open pussy')) && present('closed tight pussy')) {
    resolved.forEach((token) => {
      if (token.canonicalValue === 'closed tight pussy') drop(token, 'contradictory genital logic');
    });
  }
  if ((present('fully erect throbbing cock') || present('throbbing hard cock')) && present('flaccid soft cock')) {
    resolved.forEach((token) => {
      if (token.canonicalValue === 'flaccid soft cock') drop(token, 'contradictory futa logic');
    });
  }

  resolved.forEach((token) => {
    if (token.isDuplicate) drop(token, 'deduplication');
    if (token.emphasisLevel === 'high') {
      token.finalPromptValue = token.rewrittenPromptValue;
      token.status = token.status === 'dropped' ? token.status : 'rewritten';
    }
  });

  return resolved;
}
