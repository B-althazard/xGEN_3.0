export function buildNegativePrompt(mode) {
  if (mode === 'minimal') return 'text, watermark, signature';
  return '';
}
