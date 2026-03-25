function moveEmphasisEarlier(items) {
  const ordered = [...items];
  for (let index = 0; index < ordered.length; index += 1) {
    if (ordered[index].emphasisLevel === 'high') {
      const [item] = ordered.splice(index, 1);
      ordered.splice(Math.max(0, index - 2), 0, item);
    }
  }
  return ordered;
}

// ─── FLUX Image Type Templates ─────────────────────────────────────────────

const TEMPLATE_OPENERS = {
  portrait: {
    studio: 'professional studio photograph, photorealistic photography, RAW photo',
    social: 'candid amateur photograph, posted on social media, photorealistic photography, RAW photo',
    editorial: 'editorial fashion photograph, photorealistic photography, RAW photo',
    auto: 'photorealistic photography, RAW photo',
  },
  landscape: {
    studio: 'professional landscape photography, photorealistic photography, RAW photo',
    social: 'travel photography, photorealistic photography, RAW photo',
    editorial: 'fine art landscape photography, photorealistic photography, RAW photo',
    auto: 'landscape photography, photorealistic photography, RAW photo',
  },
  product: {
    studio: 'professional product photography, photorealistic photography, RAW photo',
    social: 'lifestyle product photography, photorealistic photography, RAW photo',
    editorial: 'editorial product photography, photorealistic photography, RAW photo',
    auto: 'product photography, photorealistic photography, RAW photo',
  },
  architecture: {
    studio: 'architectural photography, photorealistic photography, RAW photo',
    social: 'street photography, photorealistic photography, RAW photo',
    editorial: 'editorial architectural photography, photorealistic photography, RAW photo',
    auto: 'architectural photography, photorealistic photography, RAW photo',
  },
};

const TEMPLATE_BLOCK_ORDERS = {
  portrait: ['style', 'identity', 'body', 'face', 'hair', 'makeup', 'clothing', 'pose', 'scene', 'lighting', 'camera', 'multi'],
  landscape: ['style', 'scene', 'lighting', 'camera'],
  product: ['style', 'scene', 'lighting', 'camera'],
  architecture: ['style', 'scene', 'lighting', 'camera'],
};

function mergeIdentity(values) {
  const ethnicity = values.find((item) => item.domain === 'identity.ethnicity');
  const age = values.find((item) => item.domain === 'identity.age');
  if (ethnicity && age) {
    const ethText = ethnicity.finalPromptValue.replace(/ woman$/, '');
    return [`${ethText} ${age.finalPromptValue}`];
  }
  return values.map((item) => item.finalPromptValue);
}

function mergeBody(values) {
  const groups = [];
  const build = values.filter((item) => ['body.silhouette', 'body.height'].includes(item.domain));
  if (build.length) groups.push(build.map((item) => item.finalPromptValue).join(' '));

  const skinTone = values.find((item) => item.domain === 'body.skin.tone');
  const skinDetails = values.filter((item) => item.domain === 'body.skin.detail');
  if (skinTone || skinDetails.length) {
    const parts = [];
    if (skinTone) parts.push(`${skinTone.finalPromptValue.replace(/ skin$/, '')} skin`);
    if (skinDetails.length) parts.push(skinDetails.map((item) => item.finalPromptValue).join(' and '));
    groups.push(parts.join(' with '));
  }

  const bustSize = values.find((item) => item.domain === 'body.bust.size');
  const bustShape = values.find((item) => item.domain === 'body.bust.shape');
  const bustState = values.filter((item) => item.domain === 'body.bust.state');
  const bustNipples = values.filter((item) => item.domain === 'body.bust.nipples');
  const bustParts = [];
  if (bustShape) bustParts.push(bustShape.finalPromptValue.replace(/ breasts$/, ''));
  if (bustSize) bustParts.push(bustSize.finalPromptValue.replace(/ breasts$/, ''));
  bustParts.push('breasts');
  if (bustNipples.length) bustParts.push(bustNipples.map((item) => item.finalPromptValue).join(' and '));
  if (bustState.length) bustParts.push(bustState.map((item) => item.finalPromptValue).join(' and '));
  if (bustSize || bustShape || bustState.length || bustNipples.length) groups.push(bustParts.join(' '));

  const lower = values.filter((item) => item.domain.startsWith('body.lower.') && !item.domain.startsWith('body.genital'));
  if (lower.length) groups.push(lower.map((item) => item.finalPromptValue).join(' and '));

  const genital = values.filter((item) => item.domain.startsWith('body.genital.'));
  if (genital.length) groups.push(genital.map((item) => item.finalPromptValue).join(' and '));

  return groups;
}

function mergeHair(values) {
  const colors = values.filter((item) => item.domain === 'hair.color').map((item) => item.finalPromptValue.replace(/ hair$/, ''));
  const length = values.find((item) => item.domain === 'hair.length')?.finalPromptValue || '';
  const styles = values.filter((item) => item.domain === 'hair.style').map((item) => item.finalPromptValue.replace(/ hair$/, ''));
  const merged = [colors.join(' and '), length, styles.join(' and ')].filter(Boolean).join(' ');
  return merged ? [merged + ' hair'] : [];
}

function mergeEyes(values) {
  const shape = values.find((item) => item.domain === 'face.eyes.shape')?.finalPromptValue;
  const color = values.find((item) => item.domain === 'face.eyes.color')?.finalPromptValue;
  return [shape, color].filter(Boolean).length ? [[shape, color].filter(Boolean).join(' ') + ' eyes'] : [];
}

function mergeMakeup(values) {
  const items = values.filter((item) => item.finalPromptValue && item.finalPromptValue !== 'none' && item.finalPromptValue !== 'natural');
  if (!items.length) return [];
  const lipColor = values.find((item) => item.domain === 'makeup.lips.color');
  const parts = items.map((item) => item.finalPromptValue);
  if (lipColor) parts.push(lipColor.finalPromptValue);
  return parts.length ? [parts.join(', ') + ' makeup'] : [];
}

function mergeClothing(prefix, values) {
  const color = values.find((item) => item.domain === `${prefix}.color`)?.finalPromptValue;
  const type = values.find((item) => item.domain === `${prefix}.type`)?.finalPromptValue;
  const styles = values.filter((item) => item.domain === `${prefix}.style`).map((item) => item.finalPromptValue);
  const merged = [color, ...styles, type].filter(Boolean).join(' ');
  return merged ? [merged] : [];
}

// ─── FLUX Enhancement Layers ───────────────────────────────────────────────

const LIGHTING_ENRICH = {
  soft: 'soft diffused lighting with gentle shadows',
  dramatic: 'dramatic lighting with strong contrast and deep shadows',
  natural: 'natural ambient lighting',
  studio: 'professional studio lighting with balanced key and fill lights',
  cinematic: 'cinematic lighting with moody tones and atmospheric depth',
  hard: 'hard directional lighting with sharp defined shadows',
  neon: 'vibrant neon lighting with colored glow',
  candlelight: 'warm candlelight with flickering amber tones',
  firelight: 'warm firelight with dancing orange and red tones',
  moonlight: 'cool moonlight with silver-blue tones',
  sunlight: 'bright natural sunlight',
  window_light: 'soft window light with even diffused illumination',
  backlit: 'backlit with rim light halo and silhouette edges',
  silhouette: 'dramatic silhouette with strong backlight',
  chiaroscuro: 'chiaroscuro lighting with deep shadows and bright highlights',
  rembrandt: 'Rembrandt lighting with characteristic triangular shadow on cheek',
  butterfly: 'butterfly lighting with soft shadow beneath nose',
  split: 'split lighting illuminating half the face for high contrast',
  loop: 'loop lighting with soft diagonal shadow from nose',
  broad: 'broad lighting illuminating the face turned toward camera',
  short: 'short lighting with shadow on the side toward camera',
  rgb: 'RGB colored lighting with shifting hues',
  bioluminescent: 'ethereal bioluminescent glow from organic sources',
};

function enrichLighting(values) {
  if (!values.length) return [];
  const enriched = values.map((item) => {
    const key = item.optionId || item.finalPromptValue;
    return LIGHTING_ENRICH[key] || item.finalPromptValue;
  });
  return [enriched.join(' and ')];
}

function mergeCamera(values) {
  if (!values.length) return [];
  const parts = [];
  const lens = values.find((v) => v.domain === 'camera.lens');
  const framing = values.find((v) => v.domain === 'camera.framing');
  const angle = values.find((v) => v.domain === 'camera.angle');
  const depth = values.find((v) => v.domain === 'camera.depth');

  if (lens) parts.push(lens.finalPromptValue);
  if (framing) parts.push(framing.finalPromptValue);
  if (angle) parts.push(angle.finalPromptValue);
  if (depth) parts.push(depth.finalPromptValue);
  return parts.length ? [parts.join(', ')] : [];
}

function mergeScene(values) {
  if (!values.length) return [];
  const parts = [];
  const location = values.find((v) => v.domain === 'scene.location');
  const time = values.find((v) => v.domain === 'scene.time');
  const background = values.find((v) => v.domain === 'scene.background');
  const sceneType = values.find((v) => v.domain === 'scene.type');

  if (location) parts.push(location.finalPromptValue);
  if (time) parts.push(time.finalPromptValue);
  if (sceneType) parts.push(sceneType.finalPromptValue);
  if (background) parts.push(background.finalPromptValue);
  return parts.length ? [parts.join(', ')] : [];
}

export function buildBlocks(tokens, rules, settings) {
  const kept = tokens.filter((token) => token.status !== 'dropped');
  const groupMap = {
    style: [], identity: [], body: [], face: [], hair: [], makeup: [], clothing: [], scene: [], lighting: [], camera: [], pose: [], multi: [],
  };
  kept.forEach((token) => {
    const domain = token.domain;
    if (domain.startsWith('identity.')) groupMap.identity.push(token);
    else if (domain.startsWith('body.')) groupMap.body.push(token);
    else if (domain.startsWith('face.')) groupMap.face.push(token);
    else if (domain.startsWith('hair.')) groupMap.hair.push(token);
    else if (domain.startsWith('makeup.')) groupMap.makeup.push(token);
    else if (domain.startsWith('clothing.')) groupMap.clothing.push(token);
    else if (domain.startsWith('scene.')) groupMap.scene.push(token);
    else if (domain.startsWith('lighting.')) groupMap.lighting.push(token);
    else if (domain.startsWith('camera.')) groupMap.camera.push(token);
    else if (domain.startsWith('pose.') || domain.startsWith('actions.')) groupMap.pose.push(token);
    else if (domain.startsWith('multi.')) groupMap.multi.push(token);
  });

  const sortByDomainOrder = (items, blockId) => {
    const order = rules.ordering?.domainOrder?.[blockId] || [];
    return [...items].sort((a, b) => {
      const ai = order.indexOf(a.domain);
      const bi = order.indexOf(b.domain);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.sourceOrder.categoryIndex - b.sourceOrder.categoryIndex || a.sourceOrder.fieldIndex - b.sourceOrder.fieldIndex;
    });
  };

  const buildBlock = (id, items) => ({ id, items, text: items.map((item) => item.text).filter(Boolean).join(', ') });

  const imageType = settings.imageType || 'portrait';
  const openers = TEMPLATE_OPENERS[imageType] || TEMPLATE_OPENERS.portrait;
  const styleText = openers[settings.realismMode] || openers.auto;

  const identityItems = mergeIdentity(moveEmphasisEarlier(sortByDomainOrder(groupMap.identity, 'identity'))).map((text) => ({ domain: 'identity.ethnicity', text }));
  const bodyItems = mergeBody(sortByDomainOrder(groupMap.body, 'body')).map((text) => ({ domain: 'body.silhouette', text }));
  const faceItems = [
    ...mergeEyes(sortByDomainOrder(groupMap.face, 'face')).map((text) => ({ domain: 'face.eyes.shape', text })),
    ...sortByDomainOrder(groupMap.face.filter((item) => !['face.eyes.shape', 'face.eyes.color'].includes(item.domain)), 'face').map((item) => ({ domain: item.domain, text: item.finalPromptValue })),
  ];
  const hairItems = mergeHair(moveEmphasisEarlier(sortByDomainOrder(groupMap.hair, 'hair'))).map((text) => ({ domain: 'hair.color', text }));
  const makeupItems = mergeMakeup(sortByDomainOrder(groupMap.makeup, 'makeup')).map((text) => ({ domain: 'makeup.foundation', text }));
  const clothingItems = [
    ...groupMap.clothing.filter((item) => item.domain === 'clothing.complete').map((item) => ({ domain: item.domain, text: item.finalPromptValue })),
    ...mergeClothing('clothing.upper', sortByDomainOrder(groupMap.clothing, 'clothing')).map((text) => ({ domain: 'clothing.upper.type', text })),
    ...mergeClothing('clothing.lower', sortByDomainOrder(groupMap.clothing, 'clothing')).map((text) => ({ domain: 'clothing.lower.type', text })),
    ...sortByDomainOrder(groupMap.clothing.filter((item) => ['clothing.legwear', 'clothing.footwear', 'clothing.accessories'].includes(item.domain)), 'clothing').map((item) => ({ domain: item.domain, text: item.finalPromptValue })),
  ];
  const sceneItems = mergeScene(sortByDomainOrder(groupMap.scene, 'scene')).map((text) => ({ domain: 'scene.location', text }));
  const lightingItems = enrichLighting(sortByDomainOrder(groupMap.lighting, 'lighting')).map((text) => ({ domain: 'lighting.primary', text }));
  const cameraItems = mergeCamera(sortByDomainOrder(groupMap.camera, 'camera')).map((text) => ({ domain: 'camera.framing', text }));
  const poseItems = sortByDomainOrder(groupMap.pose, 'pose').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));
  const multiItems = sortByDomainOrder(groupMap.multi, 'multi').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));

  const allBlocks = {
    style: buildBlock('style', [{ domain: 'style.opener', text: styleText }]),
    identity: buildBlock('identity', identityItems),
    body: buildBlock('body', bodyItems),
    face: buildBlock('face', faceItems),
    hair: buildBlock('hair', hairItems),
    makeup: buildBlock('makeup', makeupItems),
    clothing: buildBlock('clothing', clothingItems),
    scene: buildBlock('scene', sceneItems),
    lighting: buildBlock('lighting', lightingItems),
    camera: buildBlock('camera', cameraItems),
    pose: buildBlock('pose', poseItems),
    multi: buildBlock('multi', multiItems),
  };

  const orderKey = settings.promptOrder || 'subject-first';
  let blockOrder;
  if (imageType === 'portrait') {
    // Portrait uses the promptOrder setting from rules
    blockOrder = rules.ordering.blockOrders?.[orderKey] || rules.ordering.blockOrder || Object.keys(allBlocks);
  } else {
    blockOrder = TEMPLATE_BLOCK_ORDERS[imageType] || rules.ordering.blockOrders?.[orderKey] || rules.ordering.blockOrder || Object.keys(allBlocks);
  }
  return blockOrder.map((id) => allBlocks[id]).filter(Boolean).filter((block) => block.text);
}
