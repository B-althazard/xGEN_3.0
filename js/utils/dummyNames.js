export function parseDummyNames(markdown) {
  return String(markdown || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

export function pickRandomDummyName(names, usedNames = []) {
  const pool = (names || []).filter(Boolean);
  const used = new Set((usedNames || []).map((name) => String(name || '').trim().toLowerCase()));
  const available = pool.filter((name) => !used.has(name.toLowerCase()));
  const source = available.length ? available : pool;
  if (!source.length) return null;
  return source[Math.floor(Math.random() * source.length)];
}
