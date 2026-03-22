export function buildNegativePrompt(mode) {
  if (mode === 'minimal') return 'text, watermark, signature';
  if (mode === 'repair') return 'low quality, worst quality, blurry, deformed, disfigured, bad anatomy, extra limbs, missing limbs, watermark, text, signature, ugly, gross, overexposed, underexposed, multiple views, comic, cartoon, anime, illustration, bad hands, extra fingers, bad face, ugly face';
  return '';
}
